import { HttpError } from "../shared/http-error";
import {
  buildDocumentScopeWhere,
  findDocuments,
  findDocumentForActor,
  findDocumentWithTmsForActor,
  getDocumentStatusCounts,
  setDocumentTmUpdateFlags,
  updateDocumentById,
} from "./repository";

export async function getDocumentByIdService(documentId, actorUser) {
  const document = await findDocumentWithTmsForActor(documentId, actorUser);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  const tmIds = [];
  const tmNames = [];
  const tms = [];
  for (const link of document.documentTms) {
    tmIds.push(link.tmId);
    if (typeof link.tm?.name === "string") {
      tmNames.push(link.tm.name);
    }
    tms.push({
      id: link.tmId,
      name: link.tm?.name ?? null,
      updateTm: Boolean(link.updateTm),
    });
  }

  const glossaryIds = [];
  const glossaryNames = [];
  for (const link of document.documentGlossaries) {
    glossaryIds.push(link.glossaryId);
    if (typeof link.glossary?.name === "string") {
      glossaryNames.push(link.glossary.name);
    }
  }

  return {
    ...document,
    tmIds,
    tmNames,
    tms,
    glossaryIds,
    glossaryNames,
  };
}

export async function updateDocumentTmsService(documentId, updateTmIds, actorUser) {
  const document = await findDocumentWithTmsForActor(documentId, actorUser);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  const documentTmIds = new Set(document.documentTms.map((link) => link.tmId));
  const requested = Array.isArray(updateTmIds) ? updateTmIds : [];
  const validUpdateTmIds = [
    ...new Set(requested.filter((tmId) => documentTmIds.has(tmId))),
  ];

  await setDocumentTmUpdateFlags(documentId, validUpdateTmIds);

  return { updateTmIds: validUpdateTmIds };
}

export async function listDocumentsByProjectService(projectId, actorUser) {
  const where = buildDocumentScopeWhere(actorUser, { projectId });
  const documents = await findDocuments(where);

  const documentsWithStats = await Promise.all(
    documents.map(async (document) => {
      const { countByStatus, totalCount } = await getDocumentStatusCounts(
        document.id,
      );
      return { ...document, countByStatus, totalCount };
    }),
  );

  return {
    total: documentsWithStats.length,
    docs: documentsWithStats,
  };
}

export async function updateDocumentLabelService(documentId, label, actorUser) {
  const document = await findDocumentForActor(documentId, actorUser);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  await updateDocumentById(documentId, { label });
}

export async function softDeleteDocumentService(documentId, actorUser) {
  const document = await findDocumentForActor(documentId, actorUser);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  await updateDocumentById(documentId, { deletedAt: new Date() });
}
