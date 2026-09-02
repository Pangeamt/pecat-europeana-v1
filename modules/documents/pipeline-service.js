import prisma from "../../lib/prisma";
import { postMTQE } from "../../lib/utils";
import { postEditContent } from "../../lib/daait";
import { enqueueProjectImport } from "../../lib/queue";
import { DOCUMENT_STATUS } from "../../lib/document-status";
import {
  BLOCK_REASON,
  LLM_VERDICT,
  SUGGESTION_STATUS,
  inlineTagsMatch,
  profileMatchesLanguagePair,
  resolvePipelineSettings,
} from "./pipeline-constants";

// Post-translation pipeline stages, run as chained BullMQ jobs after the
// import job persists the TUs:
//   score-mtqe  -> scores every fresh segment (document turns READY here)
//   llm-review  -> LLM judge + applicable suggestions, AFTER READY so the
//                  editor never waits for the LLM; segments update in place.
const MTQE_BATCH_SIZE = 100;
const POST_EDIT_BATCH_SIZE = 25;

export const PIPELINE_SCORE_JOB = "pipeline-score";
export const PIPELINE_REVIEW_JOB = "pipeline-review";

async function mergePipelineStats(documentId, patch) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { pipelineStats: true },
  });
  const stats = { ...(doc?.pipelineStats ?? {}), ...patch };
  await prisma.document.update({
    where: { id: documentId },
    data: { pipelineStats: stats },
  });
  return stats;
}

const scoreOf = (item) => item?.mtqe_score ?? item?.score ?? null;

const normalizeForCompare = (text) =>
  String(text ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Stage 2 — MTQE scoring. Scores every visible, unblocked segment that has a
 * target and no pipeline score yet (mtqeOriginal null covers both fresh MT
 * targets and SDLXLIFF targets whose percent attr is only a fallback).
 * The document becomes READY here; a full MTQE outage throws so BullMQ
 * retries, and the worker's final-failure hook still releases the document.
 */
export async function handleScoreMtqeJob({ projectId: documentId }) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, sourceLanguage: true, targetLanguage: true },
  });
  if (!document) return;

  await mergePipelineStats(documentId, { stage: "SCORING" });

  const started = Date.now();
  const tus = await prisma.tu.findMany({
    where: {
      documentId,
      visible: true,
      block: false,
      translatedLiteral: { not: null },
      mtqeOriginal: null,
    },
    select: { id: true, srcLiteral: true, translatedLiteral: true },
    orderBy: { count: "asc" },
  });

  let scored = 0;
  let failed = 0;
  for (let i = 0; i < tus.length; i += MTQE_BATCH_SIZE) {
    const batch = tus.slice(i, i + MTQE_BATCH_SIZE);
    const pairs = batch.map((tu) => ({
      source: tu.srcLiteral,
      target: tu.translatedLiteral,
    }));

    let response;
    try {
      response = await postMTQE({
        pairs,
        sourceLanguage: document.sourceLanguage,
        targetLanguage: document.targetLanguage,
      });
    } catch (error) {
      failed += batch.length;
      console.error(
        `[pipeline] MTQE batch failed for document ${documentId}:`,
        error.message,
      );
      continue;
    }

    const items = Array.isArray(response)
      ? response
      : (response?.pairs ?? response?.segments ?? response?.scores ?? []);
    const scoreByPair = new Map();
    for (const item of items) {
      if (typeof item?.source === "string" && typeof item?.target === "string") {
        scoreByPair.set(`${item.source}\u0000${item.target}`, scoreOf(item));
      }
    }

    for (let j = 0; j < batch.length; j++) {
      const tu = batch[j];
      const echoed = scoreByPair.get(`${tu.srcLiteral}\u0000${tu.translatedLiteral}`);
      const score = echoed ?? scoreOf(items[j]);
      if (typeof score !== "number") continue;
      await prisma.tu.update({
        where: { id: tu.id },
        data: { translationScorePercent: score, mtqeOriginal: score },
      });
      scored += 1;
    }
  }

  const totalOutage = tus.length > 0 && scored === 0 && failed === tus.length;
  await mergePipelineStats(documentId, {
    // SCORED = waiting for the LLM review stage to pick the document up.
    stage: "SCORED",
    mtqeSecs: Math.round((Date.now() - started) / 1000),
    mtqeScored: scored,
    mtqeError: failed > 0 ? `${failed} segments could not be scored` : null,
  });

  if (totalOutage) {
    // Let BullMQ retry the whole stage; the final-failure hook releases the
    // document as READY so an MTQE outage never blocks the review.
    throw new Error("MTQE service unavailable: no segment could be scored");
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: DOCUMENT_STATUS.READY },
  });

  await enqueueProjectImport(PIPELINE_REVIEW_JOB, { projectId: documentId }).catch(
    (error) =>
      console.error(
        `[pipeline] could not enqueue LLM review for ${documentId}:`,
        error.message,
      ),
  );
}

// Called by the worker when the score job exhausts its retries: the document
// must still become usable (segments simply stay unscored = low band).
export async function releaseDocumentAfterScoreFailure(documentId, error) {
  await mergePipelineStats(documentId, {
    stage: "DONE",
    mtqeError: error?.message ?? "MTQE scoring failed",
  }).catch(() => {});
  await prisma.document
    .update({ where: { id: documentId }, data: { status: DOCUMENT_STATUS.READY } })
    .catch(() => {});
}

function buildLlmComment(meta) {
  const missed = Array.isArray(meta?.missed_terms) ? meta.missed_terms : [];
  if (missed.length === 0) return null;
  const parts = missed
    .map((term) => {
      const word = term?.word ?? term?.lemma;
      const refs = Array.isArray(term?.ref_translation)
        ? term.ref_translation.filter(Boolean).join(", ")
        : null;
      if (!word) return null;
      return refs ? `${word} → ${refs}` : word;
    })
    .filter(Boolean);
  if (parts.length === 0) return null;
  return `Glosario no aplicado: ${parts.join("; ")}`.slice(0, 400);
}

function buildReviewUpdate(tu, result, settings) {
  const finalStatus = result?.final_status ?? null;
  const suggestion =
    typeof result?.target === "string" && result.target.trim() !== ""
      ? result.target
      : null;

  if (
    !suggestion ||
    finalStatus === "FAILED" ||
    finalStatus === "VALIDATION_FAILED" ||
    finalStatus === "UNPROCESSED"
  ) {
    // Fail-safe to human: record what DAAIT said, change nothing else.
    return finalStatus ? { daaitStatus: finalStatus } : null;
  }

  const meta = {
    final_status: finalStatus,
    d_score: result?.d_score ?? null,
    llm_used: result?.llm_used ?? null,
    fallback_llm: result?.fallback_llm ?? null,
    missed_terms: result?.missed_terms ?? [],
    detected_terms: result?.detected_terms ?? [],
    tokens: result?.tokens ?? null,
  };
  const comment = buildLlmComment(meta);

  const unchanged =
    normalizeForCompare(suggestion) === normalizeForCompare(tu.translatedLiteral);

  if (unchanged) {
    // The LLM saw nothing to change: auto-approve and lock (the reviewer can
    // still unlock; the padlock explains why via blockReason).
    return {
      daaitStatus: finalStatus,
      llmVerdict: LLM_VERDICT.OK,
      llmComment: comment,
      suggestionMeta: meta,
      Status: "ACCEPTED",
      block: true,
      blockReason: BLOCK_REASON.LLM_JUDGE,
    };
  }

  // The LLM proposed changes. Only store the suggestion when it preserves the
  // Okapi inline placeholders — a tag-breaking rewrite is unusable.
  if (settings.llmSuggest && inlineTagsMatch(tu.srcLiteral, suggestion)) {
    return {
      daaitStatus: finalStatus,
      llmVerdict: LLM_VERDICT.REVIEW,
      llmComment: comment,
      suggestionLiteral: suggestion,
      suggestionStatus: SUGGESTION_STATUS.PENDING,
      suggestionMeta: meta,
    };
  }

  return {
    daaitStatus: settings.llmSuggest ? "VALIDATION_FAILED" : finalStatus,
    llmVerdict: LLM_VERDICT.REVIEW,
    llmComment: comment,
    suggestionMeta: meta,
  };
}

/**
 * One-off LLM review of a single (source, draft target) pair — used by the
 * live draft evaluation in the TU editor. Same derivation rules as the batch
 * review stage, but nothing is persisted: the caller shows the outcome.
 */
export async function reviewDraftSegment({
  source,
  target,
  profileId,
  tmIds = [],
  glossaryIds = [],
  documentId,
  workspaceId,
  sourceLanguage,
  targetLanguage,
}) {
  const response = await postEditContent({
    profile_id: profileId,
    alignments: [{ source, target }],
    memory_ids: tmIds,
    glossary_ids: glossaryIds,
    use_term_score: true,
    document_id: documentId,
    workspace_id: workspaceId,
    last_batch: true,
    source_language: sourceLanguage,
    target_language: targetLanguage,
  });

  const result = response?.alignments?.[0];
  const finalStatus = result?.final_status ?? null;
  const suggestion =
    typeof result?.target === "string" && result.target.trim() !== ""
      ? result.target
      : null;

  if (
    !suggestion ||
    finalStatus === "FAILED" ||
    finalStatus === "VALIDATION_FAILED" ||
    finalStatus === "UNPROCESSED"
  ) {
    return { daaitStatus: finalStatus, verdict: null, suggestion: null, meta: null };
  }

  const meta = {
    final_status: finalStatus,
    d_score: result?.d_score ?? null,
    llm_used: result?.llm_used ?? null,
    missed_terms: result?.missed_terms ?? [],
    detected_terms: result?.detected_terms ?? [],
  };

  if (normalizeForCompare(suggestion) === normalizeForCompare(target)) {
    return { daaitStatus: finalStatus, verdict: LLM_VERDICT.OK, suggestion: null, meta };
  }
  if (!inlineTagsMatch(source, suggestion)) {
    return {
      daaitStatus: "VALIDATION_FAILED",
      verdict: LLM_VERDICT.REVIEW,
      suggestion: null,
      meta,
    };
  }
  return {
    daaitStatus: finalStatus,
    verdict: LLM_VERDICT.REVIEW,
    suggestion,
    meta,
  };
}

/**
 * Stage 3+4 — LLM review via DAAIT /content/post_edit (use_term_score on).
 * Routing gate: only segments below the document's mtqeThreshold (or without
 * score) are sent — the LLM is paid only where MTQE doubts. Runs after READY;
 * failures are recorded in pipelineStats and never touch Document.status.
 */
export async function handleLlmReviewJob({ projectId: documentId }) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      workspaceId: true,
      sourceLanguage: true,
      targetLanguage: true,
      project: {
        select: {
          profileId: true,
          settings: true,
          profile: { select: { sourceLanguage: true, targetLanguage: true } },
        },
      },
      documentTms: { select: { tmId: true } },
      documentGlossaries: { select: { glossaryId: true } },
    },
  });
  if (!document) return;

  const settings = resolvePipelineSettings(document.project?.settings);
  const profileId = document.project?.profileId;
  const profilePairOk =
    profileId &&
    profileMatchesLanguagePair(
      document.project?.profile,
      document.sourceLanguage,
      document.targetLanguage,
    );
  if (!profileId || !settings.llmJudge || !profilePairOk) {
    await mergePipelineStats(documentId, {
      stage: "DONE",
      llmSkipped: !profileId
        ? "no profile"
        : !settings.llmJudge
          ? "llmJudge disabled"
          : "profile language pair mismatch",
    });
    return;
  }

  const candidates = await prisma.tu.findMany({
    where: {
      documentId,
      visible: true,
      block: false,
      llmVerdict: null,
      translatedLiteral: { not: null },
      Status: { in: ["TRANSLATED_MT", "NOT_REVIEWED"] },
      OR: [
        { translationScorePercent: null },
        { translationScorePercent: { lt: settings.mtqeThreshold } },
      ],
    },
    select: { id: true, srcLiteral: true, translatedLiteral: true },
    orderBy: { count: "asc" },
  });

  if (candidates.length === 0) {
    await mergePipelineStats(documentId, { stage: "DONE" });
    return;
  }

  await mergePipelineStats(documentId, { stage: "REVIEWING" });
  const started = Date.now();
  const tmIds = document.documentTms.map((link) => link.tmId);
  const glossaryIds = document.documentGlossaries.map((link) => link.glossaryId);

  let judgedOk = 0;
  let suggested = 0;
  let failedSegments = 0;
  let tokensIn = 0;
  let tokensOut = 0;

  for (let i = 0; i < candidates.length; i += POST_EDIT_BATCH_SIZE) {
    const batch = candidates.slice(i, i + POST_EDIT_BATCH_SIZE);

    let response;
    try {
      response = await postEditContent({
        profile_id: profileId,
        alignments: batch.map((tu) => ({
          source: tu.srcLiteral,
          target: tu.translatedLiteral,
        })),
        memory_ids: tmIds,
        glossary_ids: glossaryIds,
        use_term_score: true,
        document_id: documentId,
        workspace_id: document.workspaceId,
        last_batch: i + POST_EDIT_BATCH_SIZE >= candidates.length,
        source_language: document.sourceLanguage,
        target_language: document.targetLanguage,
      });
    } catch (error) {
      failedSegments += batch.length;
      console.error(
        `[pipeline] post_edit batch failed for document ${documentId}:`,
        error.message,
      );
      continue;
    }

    tokensIn += response?.tokens_in ?? 0;
    tokensOut += response?.tokens_out ?? 0;
    const alignments = Array.isArray(response?.alignments)
      ? response.alignments
      : [];

    for (let j = 0; j < batch.length; j++) {
      const tu = batch[j];
      const data = buildReviewUpdate(tu, alignments[j], settings);
      if (!data) continue;
      await prisma.tu
        .update({ where: { id: tu.id }, data })
        .catch((error) =>
          console.error(`[pipeline] tu ${tu.id} update failed:`, error.message),
        );
      if (data.llmVerdict === LLM_VERDICT.OK) judgedOk += 1;
      if (data.suggestionStatus === SUGGESTION_STATUS.PENDING) suggested += 1;
    }
  }

  await mergePipelineStats(documentId, {
    stage: "DONE",
    llmSecs: Math.round((Date.now() - started) / 1000),
    llmJudged: candidates.length - failedSegments,
    llmAutoApproved: judgedOk,
    llmSuggested: suggested,
    llmError:
      failedSegments > 0 ? `${failedSegments} segments failed review` : null,
    tokensIn,
    tokensOut,
  });
}

// Called by the worker when the review job exhausts its retries: the document
// is already READY, so only record the error.
export async function recordReviewFailure(documentId, error) {
  await mergePipelineStats(documentId, {
    stage: "DONE",
    llmError: error?.message ?? "LLM review failed",
  }).catch(() => {});
}
