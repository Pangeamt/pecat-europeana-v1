import prisma from "@/lib/prisma";
import { tikalExtract, tikalMerge } from "@/lib/tikal";
import { convertPdfToDocx } from "@/lib/soffice";

// Actor-scoped document lookup shared with the documents module. Re-exported
// (with the legacy local name) so service.js keeps all persistence behind
// this repository.
export { findDocumentForActor as findProjectForActor } from "@/modules/documents/repository";

/* Okapi / LibreOffice adapters (local CLI infra) */

export function extractToXliff(filePath, sourceLang, targetLang) {
  return tikalExtract(filePath, sourceLang, targetLang);
}

export function mergeFromXliff(xlfPath) {
  return tikalMerge(xlfPath);
}

export function convertPdfDocumentToDocx(filePath) {
  return convertPdfToDocx(filePath);
}

/* Local persistence (Prisma) */

export async function findProjectById(id) {
  return prisma.document.findUnique({
    where: { id },
  });
}

export async function updateProjectById(id, data) {
  return prisma.document.update({
    where: { id },
    data,
  });
}

export async function findTusByProjectId(projectId) {
  return prisma.tu.findMany({
    where: { documentId: projectId },
  });
}
