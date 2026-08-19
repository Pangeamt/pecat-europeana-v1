import prisma from "../../lib/prisma";
import { buildDocumentScopeWhere } from "../documents/repository";

export async function findDocumentForTus(documentId, actorUser) {
  if (!documentId) return null;
  const where = buildDocumentScopeWhere(actorUser, { id: documentId });
  return prisma.document.findFirst({ where });
}

// Review UI listing: hidden segments (visibility rules) are not shown. The
// export/merge paths use their own unfiltered queries on purpose.
export async function findTusByDocumentId(documentId) {
  return prisma.tu.findMany({
    where: { documentId, visible: true },
  });
}

export async function findTuById(id) {
  return prisma.tu.findUnique({
    where: { id },
  });
}

// Review decisions propagate to identical sources WITHIN the same document
// only (never across a project's documents).
export async function findTusWithSameSource(documentId, srcLiteral, excludedTuId) {
  return prisma.tu.findMany({
    where: {
      srcLiteral,
      documentId,
      id: {
        not: excludedTuId,
      },
    },
  });
}

export async function updateTuById(id, data) {
  return prisma.tu.update({
    where: { id },
    data,
  });
}
