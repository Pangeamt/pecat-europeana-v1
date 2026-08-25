import { HttpError } from "../shared/http-error";
import { DOCUMENT_STATUS } from "../../lib/document-status";
import { postMTQE } from "../../lib/utils";
import {
  BLOCK_REASON,
  SUGGESTION_STATUS,
  resolvePipelineSettings,
} from "../documents/pipeline-constants";
import { reviewDraftSegment } from "../documents/pipeline-service";
import {
  findDocumentByTusShareToken,
  findDocumentForTus,
  findDocumentPipelineContext,
  findTuById,
  findTusByDocumentId,
  findTusWithSameSource,
  updateTuById,
} from "./repository";

async function assertTuAccessibleByActor(tu, actorUser) {
  if (!tu.documentId) {
    throw new HttpError(403, "Translation unit is not attached to a document");
  }

  const document = await findDocumentForTus(tu.documentId, actorUser);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }
  return document;
}

function clearText(txt) {
  return txt
    .normalize("NFKC")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/[​-‍﻿]/g, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s([.,;:!?])/g, "$1")
    .trim();
}

function assertDocumentReady(document) {
  if (document.status !== DOCUMENT_STATUS.READY) {
    throw new HttpError(
      409,
      "Document is not ready yet. Wait until background processing finishes.",
    );
  }
}

async function buildTusListResult(documentId) {
  const tus = await findTusByDocumentId(documentId);
  return { total: tus.length, docs: tus };
}

export async function listTusByDocumentService(documentId, actorUser) {
  if (!documentId) {
    throw new HttpError(400, "projectId is required");
  }

  const document = await findDocumentForTus(documentId, actorUser);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }
  assertDocumentReady(document);

  return buildTusListResult(documentId);
}

// Public "share as translator" link consumer — the document is resolved by
// token instead of actorUser, no session required.
export async function listTusByShareTokenService(token) {
  const document = await findDocumentByTusShareToken(token);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }
  assertDocumentReady(document);

  return buildTusListResult(document.id);
}

// Best-effort MTQE re-score of the reviewed pair: the current score follows
// each edit while mtqeOriginal keeps the pipeline's first score (the UI shows
// a "recalculated" badge when they differ). Never blocks the save.
const RESCORE_TIMEOUT_MS = 8_000;

async function rescoreReviewedPair(tu, target) {
  const text = typeof target === "string" ? target.trim() : "";
  if (!text || !tu.sourceLanguage || !tu.targetLanguage) return null;

  const timeout = new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), RESCORE_TIMEOUT_MS);
    timer.unref?.();
  });

  try {
    const response = await Promise.race([
      postMTQE({
        pairs: [{ source: tu.srcLiteral, target }],
        sourceLanguage: tu.sourceLanguage,
        targetLanguage: tu.targetLanguage,
      }),
      timeout,
    ]);
    const items = Array.isArray(response) ? response : (response?.pairs ?? []);
    const score = items[0]?.mtqe_score ?? items[0]?.score;
    return typeof score === "number" ? score : null;
  } catch {
    return null;
  }
}

async function applyTuStatusUpdate(tu, payload) {
  const { reviewLiteral, action, levenshteinDistance = null, block } = payload;

  // Manual lock/unlock (ADMIN/SUPER only, enforced by the callers): touches
  // only this TU and never propagates. Unlock overrides any lock origin
  // (TM match, LLM judge, file-internal); the review status is untouched.
  if (action === "lock" || action === "unlock") {
    const tuUpdated = await updateTuById(
      tu.id,
      action === "lock"
        ? { block: true, blockReason: BLOCK_REASON.MANUAL }
        : { block: false, blockReason: null },
    );
    return { tu: tuUpdated, alsoUpdated: [] };
  }

  // Suggestion lifecycle actions touch only this TU (sibling segments may
  // carry a different suggestion) and never change the review status.
  if (action === "apply_suggestion" || action === "discard_suggestion") {
    if (!tu.suggestionLiteral) {
      throw new HttpError(409, "This segment has no suggestion");
    }
    const tuUpdated = await updateTuById(tu.id, {
      suggestionStatus:
        action === "apply_suggestion"
          ? SUGGESTION_STATUS.APPLIED
          : SUGGESTION_STATUS.DISCARDED,
    });
    return { tu: tuUpdated, alsoUpdated: [] };
  }

  const tusWithSameSrcLiteral = await findTusWithSameSource(
    tu.documentId,
    tu.srcLiteral,
    tu.id,
  );

  const data = {};
  if (action === "approve") {
    const translatedClear = clearText(tu.translatedLiteral || "");
    const reviewClear = clearText(reviewLiteral || "");
    data.Status =
      translatedClear === reviewClear || !reviewClear ? "ACCEPTED" : "EDITED";

    data.reviewLiteral = reviewLiteral;

    const rescored = await rescoreReviewedPair(
      tu,
      reviewLiteral || tu.translatedLiteral,
    );
    if (rescored !== null) {
      data.translationScorePercent = rescored;
    }
  } else if (action === "reject") {
    data.Status = "REJECTED";
  }

  if (levenshteinDistance) {
    data.levenshteinDistance = levenshteinDistance;
  }

  if (typeof block === "boolean") {
    data.block = block;
  }

  const tuUpdated = await updateTuById(tu.id, data);

  let alsoUpdated = [];
  if (tusWithSameSrcLiteral.length > 0) {
    alsoUpdated = await Promise.all(
      tusWithSameSrcLiteral.map((item) => updateTuById(item.id, data)),
    );
  }

  return { tu: tuUpdated, alsoUpdated };
}

// Live draft evaluation: the editor calls this when the reviewer pauses
// typing. Returns a fresh MTQE score and — when the project has a profile
// with the LLM judge enabled — a fresh LLM verdict/suggestion for the draft.
// NOTHING is persisted: the stored score/suggestion only change on confirm.
async function evaluateTuDraft(tu, documentId, target) {
  const text = typeof target === "string" ? target.trim() : "";
  if (!text) {
    return { score: null, verdict: null, suggestion: null, meta: null };
  }

  const context = await findDocumentPipelineContext(documentId);
  const settings = resolvePipelineSettings(context?.project?.settings);
  const profileId = context?.project?.profileId;

  const [score, review] = await Promise.all([
    rescoreReviewedPair(tu, target),
    (async () => {
      if (!profileId || !settings.llmJudge) return null;
      try {
        return await reviewDraftSegment({
          source: tu.srcLiteral,
          target,
          profileId,
          tmIds: (context?.documentTms ?? []).map((row) => row.tmId),
          glossaryIds: (context?.documentGlossaries ?? []).map(
            (row) => row.glossaryId,
          ),
          documentId,
          workspaceId: context?.workspaceId,
        });
      } catch (error) {
        // Live feedback is best-effort: a DAAIT hiccup must not surface as an
        // editor error, the reviewer just gets no live verdict this pause.
        console.warn("[tus] live LLM evaluation failed:", error.message);
        return null;
      }
    })(),
  ]);

  return {
    score,
    verdict: review?.verdict ?? null,
    suggestion: settings.llmSuggest ? (review?.suggestion ?? null) : null,
    meta: review?.meta ?? null,
    daaitStatus: review?.daaitStatus ?? null,
  };
}

export async function evaluateTuDraftService(payload, actorUser) {
  const { tuId, target } = payload;

  const tu = await findTuById(tuId);
  if (!tu) {
    throw new HttpError(404, "Tu not found");
  }
  await assertTuAccessibleByActor(tu, actorUser);

  return evaluateTuDraft(tu, tu.documentId, target);
}

export async function evaluateTuDraftByShareTokenService(token, payload) {
  const { tuId, target } = payload;

  const document = await findDocumentByTusShareToken(token);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  const tu = await findTuById(tuId);
  if (!tu || tu.documentId !== document.id) {
    throw new HttpError(404, "Tu not found");
  }

  return evaluateTuDraft(tu, document.id, target);
}

const LOCK_ACTIONS = ["lock", "unlock"];

export async function updateTuStatusService(payload, actorUser) {
  const { tuId } = payload;

  if (
    LOCK_ACTIONS.includes(payload.action) &&
    !["ADMIN", "SUPER"].includes(actorUser?.role)
  ) {
    throw new HttpError(403, "Only admins can lock or unlock segments");
  }

  const tu = await findTuById(tuId);
  if (!tu) {
    throw new HttpError(404, "Tu not found");
  }

  await assertTuAccessibleByActor(tu, actorUser);

  return applyTuStatusUpdate(tu, payload);
}

// Public "share as translator" link consumer: authorization is proving
// knowledge of the token AND that the tu belongs to that token's document
// (otherwise a valid token for document A could edit a tuId from document B).
export async function updateTuStatusByShareTokenService(token, payload) {
  const { tuId } = payload;

  // The anonymous share link is a translator role: never lock/unlock.
  if (LOCK_ACTIONS.includes(payload.action)) {
    throw new HttpError(403, "Only admins can lock or unlock segments");
  }

  const document = await findDocumentByTusShareToken(token);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  const tu = await findTuById(tuId);
  if (!tu || tu.documentId !== document.id) {
    throw new HttpError(404, "Tu not found");
  }

  return applyTuStatusUpdate(tu, payload);
}
