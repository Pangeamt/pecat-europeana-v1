import prisma from "../../lib/prisma";
import { candidateFilter } from "../../lib/same-source";
import {
  buildDocumentScopeWhere,
  findDocumentByShareToken,
} from "../documents/repository";

export async function findDocumentForTus(documentId, actorUser) {
  if (!documentId) return null;
  const where = buildDocumentScopeWhere(actorUser, { id: documentId });
  return prisma.document.findFirst({ where });
}

// Public "share as translator" link: the token is the authorization,
// no actorUser involved.
export async function findDocumentByTusShareToken(token) {
  return findDocumentByShareToken(token);
}

// Review UI listing: hidden segments (visibility rules) are not shown. The
// export/merge paths use their own unfiltered queries on purpose.
export async function findTusByDocumentId(documentId) {
  return prisma.tu.findMany({
    where: { documentId, visible: true },
    // Document order: the grid numbers and walks the segments by it.
    orderBy: { count: "asc" },
  });
}

export async function findTuById(id) {
  return prisma.tu.findUnique({
    where: { id },
  });
}

// Everything the live draft evaluation needs to call DAAIT for a document:
// the document's OWN profile (chosen at upload time, independent of the
// project's default) and its asset links.
export async function findDocumentPipelineContext(documentId) {
  return prisma.document.findUnique({
    where: { id: documentId },
    select: {
      workspaceId: true,
      sourceLanguage: true,
      targetLanguage: true,
      extension: true,
      profileId: true,
      profile: { select: { sourceLanguage: true, targetLanguage: true } },
      documentTms: { select: { tmId: true } },
      documentGlossaries: { select: { glossaryId: true } },
    },
  });
}

// Review decisions propagate to segments with the same source WITHIN the
// same document only (never across a project's documents).
// Propagation CANDIDATES for a review decision. Locked (block) and hidden
// siblings are left alone: propagating used to overwrite the target and
// status of locked TM/file-locked segments with the same source.
// The query matches more than the rule (the column's collation ignores case,
// accents and NBSP; tag numbers may differ): `planPropagation`
// (lib/same-source.js) decides which ones get the text, and which text.
export async function findPropagationCandidates(documentId, srcLiteral, excludedTuId) {
  const filter = candidateFilter(srcLiteral);
  if (!filter) return [];
  return prisma.tu.findMany({
    where: {
      ...filter,
      documentId,
      block: false,
      visible: true,
      id: {
        not: excludedTuId,
      },
    },
  });
}

// Edit history (tu_revisions): written by the save, read by the editor's
// status popover. Newest first, capped.
export async function createTuRevisions(rows) {
  if (!rows?.length) return;
  await prisma.tuRevision.createMany({ data: rows });
}

export async function findTuRevisions(tuId, take = 100) {
  return prisma.tuRevision.findMany({
    where: { tuId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function updateTuById(id, data) {
  return prisma.tu.update({
    where: { id },
    data,
  });
}
