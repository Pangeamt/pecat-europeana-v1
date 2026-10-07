import prisma from "../../lib/prisma";
import {
  isMtqeV2Configured,
  isSpliceFormat,
  postMTQEv2Segments,
} from "../../lib/utils";
import { chunkSegments } from "../../lib/mtqe-v2";
import { postEditContent } from "../../lib/daait";
import { enqueueMtqeV2 } from "../../lib/queue";
import { suggestionKeepsTags } from "./qe-payload";
import { DOCUMENT_STATUS } from "../../lib/document-status";
import {
  BLOCK_REASON,
  LLM_VERDICT,
  SUGGESTION_STATUS,
  profileMatchesLanguagePair,
  resolvePipelineSettings,
} from "./pipeline-constants";

// Post-translation pipeline: once the import job persists the TUs the
// document turns READY straight away (releaseDocumentAndScore) and QE v2
// scores the segments in the background on its own queue — the editor never
// waits for scoring. The retired LLM judge stage (llm-review) is kept below
// unused.
const POST_EDIT_BATCH_SIZE = 25;

export const PIPELINE_REVIEW_JOB = "pipeline-review";
// Runs on the dedicated MTQE_V2_QUEUE, not the import queue.
export const MTQE_V2_JOB = "score-mtqe-v2";

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

const normalizeForCompare = (text) =>
  String(text ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Called right after the import job persists the TUs: the document turns
 * READY straight away and QE v2 is scheduled on its own Bull queue
 * (MTQE_V2_QUEUE), so scoring progresses and retries independently of the
 * import pipeline and the editor never waits for it. The v2 enqueue is
 * best-effort: a failure is logged and the document simply stays unscored.
 * pipelineStats.stage tracks the scoring: SCORING while queued/running,
 * DONE when finished (no stage at all = QE v2 not configured).
 */
// Progress of the machine translation while the document is still
// PROCESSING (its segments are only stored at the end): how many of the
// segments sent to DAAIT are back, and how many segments the file has. Shown
// by the documents list ("Translating 150 of 811").
export async function recordTranslationProgress(documentId, { done, total, segments }) {
  await mergePipelineStats(documentId, {
    mtDone: done,
    mtTotal: total,
    segmentsTotal: segments,
  });
}

export async function releaseDocumentAndScore(documentId) {
  await prisma.document.update({
    where: { id: documentId },
    data: { status: DOCUMENT_STATUS.READY },
  });

  // The automatic LLM judge stage (pipeline-review) is retired: the project
  // no longer offers an MTQE threshold/judge/suggestion toggle, so nothing
  // enqueues PIPELINE_REVIEW_JOB anymore. handleLlmReviewJob and friends stay
  // in pipeline-service.js unused (no call site) rather than deleted.

  if (!isMtqeV2Configured()) return;

  // Marked BEFORE enqueueing so the job's own DONE can never be overwritten.
  await mergePipelineStats(documentId, { stage: "SCORING" });
  try {
    await enqueueMtqeV2(MTQE_V2_JOB, { projectId: documentId });
  } catch (error) {
    console.error(
      `[pipeline] could not enqueue MTQE v2 for ${documentId}:`,
      error.message,
    );
    await mergePipelineStats(documentId, {
      stage: "DONE",
      mtqeV2Error: `QE v2 not scheduled: ${error.message}`,
    }).catch(() => {});
  }
}

/**
 * The document's translation memories and glossaries (DAAIT resource ids, the
 * ones linked at upload): what MTQE v2 takes its references from.
 */
export async function findQeResourceIds(documentId) {
  const [tms, glossaries] = await Promise.all([
    prisma.documentTm.findMany({
      where: { documentId },
      select: { tmId: true },
    }),
    prisma.documentGlossary.findMany({
      where: { documentId },
      select: { glossaryId: true },
    }),
  ]);
  return {
    tmIds: tms.map((row) => row.tmId),
    glossaryIds: glossaries.map((row) => row.glossaryId),
  };
}

/**
 * MTQE v2 job (own queue): scores every visible segment that still lacks a
 * QE score, via /score-segments in batches of up to 50, with the document's
 * memories and glossaries as references. Each batch's scores are stored as
 * soon as it answers (0-100, normalized to 0-1), so the open editor shows
 * them arriving while the rest is still being scored.
 * Throws on a total outage so BullMQ retries the job; partial failures are
 * recorded in pipelineStats and never touch Document.status.
 */
export async function handleScoreMtqeV2Job({ projectId: documentId }) {
  if (!isMtqeV2Configured()) return;
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, sourceLanguage: true, targetLanguage: true },
  });
  if (!document) return;
  const { tmIds, glossaryIds } = await findQeResourceIds(documentId);

  const tus = await prisma.tu.findMany({
    where: {
      documentId,
      visible: true,
      block: false,
      translatedLiteral: { not: null },
      mtqeV2Score: null,
    },
    select: {
      id: true,
      srcLiteral: true,
      translatedLiteral: true,
    },
    orderBy: { count: "asc" },
  });
  if (tus.length === 0) {
    await mergePipelineStats(documentId, { stage: "DONE", mtqeV2Scored: 0 });
    return;
  }

  const started = Date.now();
  let scored = 0;
  let failed = 0;
  for (const batch of chunkSegments(tus)) {
    let scores;
    try {
      scores = await postMTQEv2Segments({
        segments: batch.map((tu) => ({
          source: tu.srcLiteral,
          target: tu.translatedLiteral,
        })),
        sourceLanguage: document.sourceLanguage,
        targetLanguage: document.targetLanguage,
        tmIds,
        glossaryIds,
      });
    } catch (error) {
      failed += batch.length;
      console.error(
        `[pipeline] MTQE v2 failed for a batch of ${batch.length} segments (document ${documentId}):`,
        error.message,
      );
      continue;
    }

    // A per-segment upstream error comes back as a null score.
    const updates = [];
    batch.forEach((tu, index) => {
      if (scores[index] === null) {
        failed += 1;
        return;
      }
      updates.push(
        prisma.tu.update({
          where: { id: tu.id },
          data: { mtqeV2Score: scores[index] },
        }),
      );
    });
    if (updates.length > 0) {
      await prisma.$transaction(updates);
      scored += updates.length;
      // Progress for the pipeline cell while the stage is still SCORING.
      await mergePipelineStats(documentId, { mtqeV2Scored: scored });
    }
  }

  const totalOutage = scored === 0 && failed === tus.length;
  await mergePipelineStats(documentId, {
    // A total outage stays SCORING: BullMQ retries, and the final-failure
    // hook closes the stage if every attempt fails.
    ...(totalOutage ? {} : { stage: "DONE" }),
    mtqeV2Scored: scored,
    mtqeV2Secs: Math.round((Date.now() - started) / 1000),
    mtqeV2Error:
      failed > 0 ? `${failed} segments could not be v2-scored` : null,
  });

  if (totalOutage) {
    throw new Error("MTQE v2 unavailable: no segment could be scored");
  }
}

// Final-failure hook for the v2 queue: the document is already READY, so the
// outcome lands in pipelineStats and nowhere else (segments stay unscored).
export async function recordMtqeV2Failure(documentId, error) {
  await mergePipelineStats(documentId, {
    stage: "DONE",
    mtqeV2Error: error?.message ?? "MTQE v2 scoring failed",
  }).catch(() => {});
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

function buildReviewUpdate(tu, result, settings, { ordered = false } = {}) {
  const finalStatus = result?.final_status ?? null;
  const suggestion =
    typeof result?.target === "string" && result.target.trim() !== ""
      ? result.target
      : null;

  if (
    !suggestion ||
    finalStatus === "FAILED" ||
    finalStatus === "VALIDATION_FAILED" ||
    finalStatus === "UNPROCESSED" ||
    // A suggestion that loses, invents or reorders tags is dropped.
    !suggestionKeepsTags(tu.srcLiteral, suggestion, { ordered })
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

  // The LLM proposed changes; its tags already passed the gate above, so it
  // is applicable even on a tagged segment.
  if (settings.llmSuggest) {
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
  ordered = false,
}) {
  // Source and target WITH their inline-tag placeholders (qe-payload.js).
  const pair = { source, target };
  const response = await postEditContent({
    profile_id: profileId,
    alignments: [pair],
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

  if (normalizeForCompare(suggestion) === normalizeForCompare(pair.target)) {
    return { daaitStatus: finalStatus, verdict: LLM_VERDICT.OK, suggestion: null, meta };
  }
  // A suggestion that loses, invents or reorders the source's tags is not shown.
  if (!suggestionKeepsTags(source, suggestion, { ordered })) {
    return { daaitStatus: finalStatus, verdict: null, suggestion: null, meta: null };
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
 * Routing gate: only segments whose QE v2 score is below the document's
 * mtqeThreshold (or without score) are sent — the LLM is paid only where QE
 * doubts. Runs after READY;
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
      extension: true,
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
        { mtqeV2Score: null },
        { mtqeV2Score: { lt: settings.mtqeThreshold } },
      ],
      // A segment whose tags do not match the source (flagged at import) goes
      // to a human as is: the judge could auto-approve AND lock it, and a
      // locked segment with broken tags can neither be fixed nor exported.
      // (`not` alone would also drop the NULLs.)
      AND: [{ OR: [{ daaitStatus: null }, { daaitStatus: { not: "VALIDATION_FAILED" } }] }],
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
      const data = buildReviewUpdate(tu, alignments[j], settings, {
        ordered: isSpliceFormat(document.extension),
      });
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
