import { HttpError } from "../shared/http-error";
import {
  findDocumentByShareToken,
  findDocumentForActor,
  updateDocumentById,
} from "./repository";

// Submission locks: once a role submits, that role can no longer edit the
// document's segments (ADMIN/SUPER always keep editing — they act as PM).
// Only a PM (ADMIN/SUPER) reopens. Every transition is appended to
// Document.editLog for traceability: { action, role, by, byUserId?, at }.

export const SUBMISSION_ROLES = ["translator", "reviewer"];

const ROLE_FIELD = {
  translator: "translatorSubmittedAt",
  reviewer: "reviewerSubmittedAt",
};

function appendLog(document, entry) {
  const log = Array.isArray(document.editLog) ? document.editLog : [];
  // Cap the trail so the JSON column never grows unbounded.
  return [...log, entry].slice(-200);
}

export function submissionStateOf(document) {
  return {
    translatorSubmittedAt: document.translatorSubmittedAt ?? null,
    reviewerSubmittedAt: document.reviewerSubmittedAt ?? null,
  };
}

function assertRole(role) {
  if (!SUBMISSION_ROLES.includes(role)) {
    throw new HttpError(400, "role must be translator or reviewer");
  }
}

// The PM (ADMIN/SUPER) may submit on behalf of a role; otherwise only the
// user assigned to that role on this document may close it.
function assertMaySubmit(document, role, actorUser) {
  if (["ADMIN", "SUPER"].includes(actorUser?.role)) return;
  const assigneeId =
    role === "translator" ? document.translatorId : document.reviewerId;
  if (!assigneeId || assigneeId !== actorUser?.id) {
    throw new HttpError(403, `Only the assigned ${role} can submit`);
  }
}

export async function submitDocumentService(documentId, role, actorUser) {
  assertRole(role);
  const document = await findDocumentForActor(documentId, actorUser);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }
  assertMaySubmit(document, role, actorUser);

  const field = ROLE_FIELD[role];
  if (document[field]) {
    throw new HttpError(409, `The ${role} already submitted this document`);
  }

  const now = new Date();
  const updated = await updateDocumentById(documentId, {
    [field]: now,
    editLog: appendLog(document, {
      action: "submit",
      role,
      by: actorUser?.email ?? actorUser?.id ?? "unknown",
      byUserId: actorUser?.id ?? null,
      at: now.toISOString(),
    }),
  });
  return submissionStateOf(updated);
}

// Reopening is a PM-only action, per role, so the translator's lock and the
// reviewer's lock are lifted independently.
export async function reopenDocumentService(documentId, role, actorUser) {
  assertRole(role);
  if (!["ADMIN", "SUPER"].includes(actorUser?.role)) {
    throw new HttpError(403, "Only a project manager can reopen editing");
  }
  const document = await findDocumentForActor(documentId, actorUser);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  const field = ROLE_FIELD[role];
  if (!document[field]) {
    throw new HttpError(409, `The ${role} has not submitted this document`);
  }

  const updated = await updateDocumentById(documentId, {
    [field]: null,
    editLog: appendLog(document, {
      action: "reopen",
      role,
      by: actorUser?.email ?? actorUser?.id ?? "unknown",
      byUserId: actorUser?.id ?? null,
      at: new Date().toISOString(),
    }),
  });
  return submissionStateOf(updated);
}

// Anonymous "share as translator" link: possession of the token is the
// authorization (same pattern as the TU endpoints), and it can only close
// the translator side.
export async function submitDocumentByShareTokenService(token) {
  const document = await findDocumentByShareToken(token);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }
  if (document.translatorSubmittedAt) {
    throw new HttpError(409, "The translator already submitted this document");
  }

  const now = new Date();
  const updated = await updateDocumentById(document.id, {
    translatorSubmittedAt: now,
    editLog: appendLog(document, {
      action: "submit",
      role: "translator",
      by: "share-link",
      byUserId: null,
      at: now.toISOString(),
    }),
  });
  return submissionStateOf(updated);
}
