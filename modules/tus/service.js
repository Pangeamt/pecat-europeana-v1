import { HttpError } from "../shared/http-error";
import { DOCUMENT_STATUS } from "../../lib/document-status";
import {
  findDocumentByTusShareToken,
  findDocumentForTus,
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

async function applyTuStatusUpdate(tu, payload) {
  const { reviewLiteral, action, levenshteinDistance = null, block } = payload;

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

export async function updateTuStatusService(payload, actorUser) {
  const { tuId } = payload;

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
