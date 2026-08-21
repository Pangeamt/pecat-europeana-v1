import prisma from "../../lib/prisma";

export async function findDocuments(where) {
  return prisma.document.findMany({
    where,
    select: {
      id: true,
      filename: true,
      status: true,
      mt: true,
      extension: true,
      createdAt: true,
      deletedAt: true,
      label: true,
      sourceLanguage: true,
      targetLanguage: true,
      projectId: true,
      inheritProfile: true,
      translatorId: true,
      reviewerId: true,
      User: {
        select: {
          name: true,
          email: true,
        },
      },
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
      translator: {
        select: { id: true, name: true, email: true, image: true },
      },
      reviewer: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });
}

export async function findWorkspaceUserById(userId, workspaceId) {
  if (!userId) return null;
  return prisma.user.findFirst({
    where: { id: userId, workspaceId, deletedAt: null },
    select: { id: true, name: true, email: true, image: true },
  });
}

export async function findDocumentById(id) {
  return prisma.document.findUnique({
    where: { id },
  });
}

export function buildDocumentScopeWhere(actorUser, extra = {}) {
  const role = String(actorUser?.role || "").toUpperCase();

  if (role === "SUPER") {
    return { ...extra };
  }

  const where = { deletedAt: null, ...extra };

  if (actorUser.workspaceId) {
    where.workspaceId = actorUser.workspaceId;
  } else {
    where.workspaceId = "__no_workspace__";
  }

  // USER visibility is assignment-only (translator or reviewer) — being the
  // uploader no longer grants access on its own.
  if (role === "USER") {
    where.OR = [{ translatorId: actorUser.id }, { reviewerId: actorUser.id }];
  }

  return where;
}

export async function findDocumentForActor(documentId, actorUser) {
  if (!documentId) return null;
  const where = buildDocumentScopeWhere(actorUser, { id: documentId });
  return prisma.document.findFirst({ where });
}

export async function findDocumentWithTmsForActor(documentId, actorUser) {
  if (!documentId) return null;
  const where = buildDocumentScopeWhere(actorUser, { id: documentId });

  return prisma.document.findFirst({
    where,
    include: {
      documentTms: {
        select: {
          tmId: true,
          updateTm: true,
          tm: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      documentGlossaries: {
        select: {
          glossaryId: true,
          glossary: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function findValidTmIdsInWorkspace(tmIds, workspaceId) {
  if (!Array.isArray(tmIds) || tmIds.length === 0) return [];
  if (!workspaceId) return [];

  const rows = await prisma.tm.findMany({
    where: {
      id: { in: tmIds },
      workspaceId,
      deletedAt: null,
    },
    select: { id: true },
  });

  return rows.map((row) => row.id);
}

export async function findValidGlossaryIdsInWorkspace(glossaryIds, workspaceId) {
  if (!Array.isArray(glossaryIds) || glossaryIds.length === 0) return [];
  if (!workspaceId) return [];

  const rows = await prisma.glossary.findMany({
    where: {
      id: { in: glossaryIds },
      workspaceId,
      deletedAt: null,
    },
    select: { id: true },
  });

  return rows.map((row) => row.id);
}

export async function findTusByDocumentId(documentId) {
  return prisma.tu.findMany({
    where: { documentId },
  });
}

export async function getDocumentStatusCounts(documentId) {
  // Hidden segments never reach the review queue, so they must not count
  // towards progress either (a document with them could never hit 100%).
  const [countByStatus, totalCount] = await Promise.all([
    prisma.tu.groupBy({
      by: ["Status"],
      _count: true,
      where: { documentId, visible: true },
    }),
    prisma.tu.count({
      where: { documentId, visible: true },
    }),
  ]);

  return { countByStatus, totalCount };
}

export async function updateDocumentById(id, data) {
  return prisma.document.update({
    where: { id },
    data,
  });
}

export async function setDocumentTmUpdateFlags(documentId, updateTmIds) {
  const ids = Array.isArray(updateTmIds) ? updateTmIds : [];

  await prisma.$transaction([
    prisma.documentTm.updateMany({
      where: { documentId },
      data: { updateTm: false },
    }),
    ...(ids.length > 0
      ? [
          prisma.documentTm.updateMany({
            where: { documentId, tmId: { in: ids } },
            data: { updateTm: true },
          }),
        ]
      : []),
  ]);
}
