import { uid } from "uid";
import { HttpError } from "../shared/http-error";
import { assertWorkspaceAssetAccess } from "../shared/roles";
import {
  buildDocumentScopeWhere,
  findDocuments,
  findDocumentForActor,
  findDocumentWithTmsForActor,
  findDocumentWithTmsByShareToken,
  findWorkspaceUserById,
  getDocumentStatusCounts,
  setDocumentTmUpdateFlags,
  updateDocumentById,
} from "./repository";

const ASSIGNMENT_FIELDS = { translator: "translatorId", reviewer: "reviewerId" };

function mapUserImage(user) {
  if (!user) return user;
  return { ...user, image: user.image ? user.image.toString("utf-8") : null };
}

function shapeDocumentWithTms(document) {
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

export async function getDocumentByIdService(documentId, actorUser) {
  const document = await findDocumentWithTmsForActor(documentId, actorUser);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  return shapeDocumentWithTms(document);
}

// Public "share as translator" link consumer: resolves the document by
// token only, no actorUser — feeds the standalone /share/tu/[token] editor.
export async function getDocumentConfigByShareTokenService(token) {
  const document = await findDocumentWithTmsByShareToken(token);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  return shapeDocumentWithTms(document);
}

// Only ADMIN/SUPER manage the translator share link — it grants full,
// no-login write access to the document's segments to anyone holding the
// URL, so creating/revoking it is a management action like assignment.
export async function getDocumentTranslatorShareService(documentId, actorUser) {
  assertWorkspaceAssetAccess(actorUser);

  const document = await findDocumentForActor(documentId, actorUser);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  return { token: document.translatorShareToken ?? null };
}

export async function generateDocumentTranslatorShareService(
  documentId,
  actorUser,
) {
  assertWorkspaceAssetAccess(actorUser);

  const document = await findDocumentForActor(documentId, actorUser);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  const token = uid();
  await updateDocumentById(documentId, {
    translatorShareToken: token,
    translatorShareCreatedAt: new Date(),
  });

  return { token };
}

export async function revokeDocumentTranslatorShareService(
  documentId,
  actorUser,
) {
  assertWorkspaceAssetAccess(actorUser);

  const document = await findDocumentForActor(documentId, actorUser);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  await updateDocumentById(documentId, {
    translatorShareToken: null,
    translatorShareCreatedAt: null,
  });
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
      return {
        ...document,
        translator: mapUserImage(document.translator),
        reviewer: mapUserImage(document.reviewer),
        countByStatus,
        totalCount,
      };
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

// Only ADMIN/SUPER assign — a document's translator/reviewer are the only
// thing that grants a USER visibility into it, so this is a management
// action, not something the affected users can do themselves.
export async function assignDocumentUserService(
  documentId,
  role,
  userId,
  actorUser,
) {
  assertWorkspaceAssetAccess(actorUser);

  const field = ASSIGNMENT_FIELDS[role];
  if (!field) {
    throw new HttpError(400, `Invalid assignment role: ${role}`);
  }

  const document = await findDocumentForActor(documentId, actorUser);
  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  let assignee = null;
  if (userId) {
    assignee = await findWorkspaceUserById(userId, document.workspaceId);
    if (!assignee) {
      throw new HttpError(
        400,
        "The selected user does not exist or is not in this document's workspace",
      );
    }
  }

  await updateDocumentById(documentId, { [field]: userId || null });

  return { [role]: mapUserImage(assignee) };
}
