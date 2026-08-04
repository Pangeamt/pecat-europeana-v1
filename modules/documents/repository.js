import prisma from "@/lib/prisma";
import { tikalExtract, tikalMerge } from "@/lib/tikal";
import { convertPdfToDocx } from "@/lib/soffice";

// Actor-scoped project lookup shared with the projects module. Re-exported
// here so documents/service.js keeps all persistence behind this repository.
export { findProjectForActor } from "@/modules/projects/repository";

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
  return prisma.project.findUnique({
    where: { id },
  });
}

export async function updateProjectById(id, data) {
  return prisma.project.update({
    where: { id },
    data,
  });
}

export async function findTusByProjectId(projectId) {
  return prisma.tu.findMany({
    where: { projectId },
  });
}
