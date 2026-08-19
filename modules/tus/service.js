import { HttpError } from "../shared/http-error";
import { DOCUMENT_STATUS } from "../../lib/document-status";
import {
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

export async function listTusByDocumentService(documentId, actorUser) {
  if (!documentId) {
    throw new HttpError(400, "projectId is required");
  }

  const document = await findDocumentForTus(documentId, actorUser);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }
  if (document.status !== DOCUMENT_STATUS.READY) {
    throw new HttpError(
      409,
      "Document is not ready yet. Wait until background processing finishes.",
    );
  }

  const tus = await findTusByDocumentId(documentId);
  return {
    total: tus.length,
    docs: tus,
  };
}

export async function updateTuStatusService(payload, actorUser) {
  const {
    tuId,
    reviewLiteral,
    action,
    levenshteinDistance = null,
    block,
  } = payload;

  const tu = await findTuById(tuId);
  if (!tu) {
    throw new HttpError(404, "Tu not found");
  }

  await assertTuAccessibleByActor(tu, actorUser);

  const tusWithSameSrcLiteral = await findTusWithSameSource(
    tu.documentId,
    tu.srcLiteral,
    tuId,
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

  const tuUpdated = await updateTuById(tuId, data);

  let alsoUpdated = [];
  if (tusWithSameSrcLiteral.length > 0) {
    alsoUpdated = await Promise.all(
      tusWithSameSrcLiteral.map((item) => updateTuById(item.id, data)),
    );
  }

  return { tu: tuUpdated, alsoUpdated };
}
