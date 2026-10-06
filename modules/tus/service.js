import { HttpError } from "../shared/http-error";
import { DOCUMENT_STATUS } from "../../lib/document-status";
import { isMtqeV2Configured, postMTQEv2Segments } from "../../lib/utils";
import {
  BLOCK_REASON,
  SUGGESTION_STATUS,
  profileMatchesLanguagePair,
} from "../documents/pipeline-constants";
import {
  findQeResourceIds,
  reviewDraftSegment,
} from "../documents/pipeline-service";
import { describeTagIssue, tagIssue } from "../documents/tag-check";
import { isSpliceFormat } from "../../lib/utils";
import { buildTuRevisions } from "../../lib/tu-revision";
import {
  createTuRevisions,
  findTuRevisions,
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

// Submission locks (see modules/documents/submission-service.js): once a
// role submitted, that role can no longer edit segments. ADMIN/SUPER act as
// PM and always keep editing; a user holding both roles keeps editing while
// at least one of their roles is still open.
function assertActorMayEditDocument(document, actorUser) {
  if (["ADMIN", "SUPER"].includes(actorUser?.role)) return;

  const heldRoles = [];
  if (document.translatorId && document.translatorId === actorUser?.id) {
    heldRoles.push("translator");
  }
  if (document.reviewerId && document.reviewerId === actorUser?.id) {
    heldRoles.push("reviewer");
  }
  if (heldRoles.length === 0) return;

  const someRoleOpen = heldRoles.some((role) =>
    role === "translator"
      ? !document.translatorSubmittedAt
      : !document.reviewerSubmittedAt,
  );
  if (!someRoleOpen) {
    throw new HttpError(
      409,
      "Editing is closed: this work was already submitted. Ask a project manager to reopen it.",
      "SUBMISSION_LOCKED",
    );
  }
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

// Best-effort QE v2 re-score of the reviewed pair (same references as the
// pipeline: the document's memories and glossaries): the stored score
// follows each edit. Returns 0-1 or null. Never blocks the save.
const RESCORE_TIMEOUT_MS = 8_000;

async function rescoreReviewedPair(tu, target) {
  const text = typeof target === "string" ? target.trim() : "";
  if (!text || !tu.sourceLanguage || !tu.targetLanguage) return null;
  if (!isMtqeV2Configured()) return null;

  const timeout = new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), RESCORE_TIMEOUT_MS);
    timer.unref?.();
  });

  try {
    const rescore = async () => {
      const { tmIds, glossaryIds } = await findQeResourceIds(tu.documentId);
      return postMTQEv2Segments({
        segments: [{ source: tu.srcLiteral, target }],
        sourceLanguage: tu.sourceLanguage,
        targetLanguage: tu.targetLanguage,
        tmIds,
        glossaryIds,
        timeout: RESCORE_TIMEOUT_MS,
      });
    };
    const scores = await Promise.race([rescore(), timeout]);
    // One segment in, one 0-1 score out (null on an upstream failure).
    return scores?.[0] ?? null;
  } catch {
    return null;
  }
}

// Saves the action AND its history row(s): text, status and MTQE before and
// after, for the segment and for every same-source segment it propagated to.
// The history is best-effort -- it never fails nor delays the answer's content.
async function applyTuStatusUpdate(tu, payload, reviewer = null) {
  const propagates = payload.action === "approve" || payload.action === "reject";
  let siblingsBefore = [];
  if (propagates && !tu.block) {
    siblingsBefore = await findTusWithSameSource(
      tu.documentId,
      tu.srcLiteral,
      tu.id,
    ).catch(() => []);
  }
  const result = await saveTuStatusUpdate(tu, payload, reviewer);
  try {
    const beforeById = new Map(siblingsBefore.map((item) => [item.id, item]));
    await createTuRevisions(
      buildTuRevisions({
        action: payload.action,
        before: tu,
        after: result.tu,
        siblings: (result.alsoUpdated ?? []).map((after) => ({
          before: beforeById.get(after.id) ?? null,
          after,
        })),
        by: reviewer,
      }),
    );
  } catch (error) {
    console.error(`[tus] history not written for ${tu.id}:`, error.message);
  }
  return result;
}

async function saveTuStatusUpdate(tu, payload, reviewer = null) {
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

  // A locked segment (file lock, TM match, LLM judge, manual) keeps its target
  // and its tags whoever edits: the UI already shows it read-only, and the API
  // refuses too -- an admin unlocks it first (like Trados' locked segments).
  if (tu.block) {
    throw new HttpError(
      409,
      "This segment is locked: unlock it before editing",
      "SEGMENT_LOCKED",
    );
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
      reviewedAt: new Date(),
    });
    return { tu: tuUpdated, alsoUpdated: [] };
  }

  // Save a DRAFT: persist the reviewer's text WITHOUT approving it. The review
  // status is untouched (the segment keeps waiting for Confirm), nothing
  // propagates to same-source siblings, and the QE v2 score follows the saved
  // text. An empty text clears the draft (the segment falls back to the MT).
  if (action === "save_draft") {
    const text = typeof reviewLiteral === "string" ? reviewLiteral : "";
    const draft = {
      reviewLiteral: text.trim() ? text : null,
      reviewedAt: new Date(),
    };
    if (reviewer) {
      draft.reviewedById = reviewer.id ?? null;
      draft.reviewedByName = reviewer.name ?? null;
    }
    const rescoredDraft = await rescoreReviewedPair(
      tu,
      text.trim() ? text : tu.translatedLiteral,
    );
    if (rescoredDraft !== null) draft.mtqeV2Score = rescoredDraft;
    const tuUpdated = await updateTuById(tu.id, draft);
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
      data.mtqeV2Score = rescored;
    }
  } else if (action === "reject") {
    data.Status = "REJECTED";
  }

  // Trace who performed the review action ("Edited by María" tooltips).
  // Sibling segments (same source) get the same reviewer via `data`.
  if (action === "approve" || action === "reject") {
    data.reviewedAt = new Date();
  }
  if ((action === "approve" || action === "reject") && reviewer) {
    data.reviewedById = reviewer.id ?? null;
    data.reviewedByName = reviewer.name ?? null;
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
// typing. Returns a fresh QE v2 score and — when the document has a profile
// (chosen at upload time) whose language pair matches — a fresh LLM
// verdict/suggestion for the draft. Always on, on demand, per segment; no
// project-level switch. NOTHING is persisted: the stored score/suggestion
// only change on confirm.
async function evaluateTuDraft(tu, documentId, target) {
  const text = typeof target === "string" ? target.trim() : "";
  if (!text) {
    return { score: null, verdict: null, suggestion: null, meta: null };
  }

  const context = await findDocumentPipelineContext(documentId);
  const profileId = context?.profileId;
  // A wrong-direction profile makes DAAIT echo the source back — skip the
  // LLM part entirely (QE v2 still runs).
  const profilePairOk =
    profileId &&
    profileMatchesLanguagePair(
      context?.profile,
      context?.sourceLanguage,
      context?.targetLanguage,
    );

  const [score, review] = await Promise.all([
    rescoreReviewedPair(tu, target),
    (async () => {
      if (!profileId || !profilePairOk) return null;
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
          sourceLanguage: context?.sourceLanguage,
          targetLanguage: context?.targetLanguage,
          ordered: isSpliceFormat(context?.extension),
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
    suggestion: review?.suggestion ?? null,
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

// Inline tags (<g1>...</g1>, <x2/>) must survive an edit: a target that
// loses, invents or duplicates one cannot be written back into the file
// (the export skips it and the reviewer's work never reaches the client).
// The TagEditor already prevents it in the UI; this covers the API. For
// SDLXLIFF the ORDER must be the source's too -- the export only writes a
// segment whose tag signature matches the seg-source in order (the same rule
// module-file-translate enforces with FT-111).
function assertInlineTagsKept(tu, payload, document) {
  if (!["approve", "save_draft"].includes(payload.action) || !payload.reviewLiteral) return;
  // No early return when the source has no tags: a placeholder typed by hand
  // (e.g. "<x1/>" in the plain Quill editor) would be stored as a real tag and
  // the export would then skip the segment. It is reported as "extra".
  const issue = tagIssue(tu.srcLiteral, payload.reviewLiteral, {
    ordered: isSpliceFormat(document?.extension),
  });
  if (issue.ok) return;
  throw new HttpError(
    422,
    `The target's inline tags don't match the source's (${describeTagIssue(issue)})`,
    "INLINE_TAGS_MISMATCH",
  );
}

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

  const document = await assertTuAccessibleByActor(tu, actorUser);
  assertActorMayEditDocument(document, actorUser);

  assertInlineTagsKept(tu, payload, document);

  return applyTuStatusUpdate(tu, payload, {
    id: actorUser?.id ?? null,
    name: actorUser?.name || actorUser?.email || null,
  });
}

// Edit history of one segment, newest first (same access rule as editing it).
export async function listTuRevisionsService(tuId, actorUser) {
  const tu = await findTuById(tuId);
  if (!tu) {
    throw new HttpError(404, "Tu not found");
  }
  await assertTuAccessibleByActor(tu, actorUser);
  return { revisions: await findTuRevisions(tuId) };
}

export async function listTuRevisionsByShareTokenService(token, tuId) {
  const document = await findDocumentByTusShareToken(token);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }
  const tu = await findTuById(tuId);
  if (!tu || tu.documentId !== document.id) {
    throw new HttpError(404, "Tu not found");
  }
  return { revisions: await findTuRevisions(tuId) };
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

  // The share link IS the translator role: once the translation was
  // submitted, the link becomes read-only until a PM reopens it.
  if (document.translatorSubmittedAt) {
    throw new HttpError(
      409,
      "Editing is closed: this translation was already submitted. Ask a project manager to reopen it.",
      "SUBMISSION_LOCKED",
    );
  }

  const tu = await findTuById(tuId);
  if (!tu || tu.documentId !== document.id) {
    throw new HttpError(404, "Tu not found");
  }

  // Anonymous link: no user identity — attribute the action to the link.
  assertInlineTagsKept(tu, payload, document);
  return applyTuStatusUpdate(tu, payload, {
    id: null,
    name: "Translator link",
  });
}
