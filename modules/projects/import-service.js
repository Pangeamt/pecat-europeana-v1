import fs from "fs";
import { pipeline } from "stream";
import { uid } from "uid";
import { promisify } from "util";
import prisma from "../../lib/prisma";
import { checkFile } from "../../lib/utils";
import { enqueueProjectImport } from "../../lib/queue";
import { HttpError } from "../shared/http-error";
import { findValidGlossaryIdsInWorkspace, findValidTmIdsInWorkspace } from "./repository";
import { UnrecoverableError } from "bullmq";
import {
  deleteProjectDocumentService,
  extractDocumentSegmentsService,
  linkProjectDocumentService,
} from "@/modules/documents";
import {
  parseSdlxliffFile,
  enrichSdlxliffSegments,
  buildTusDataFromSdlxliffSegments,
} from "./sdlxliff-service";

const pump = promisify(pipeline);
const PROJECT_STATUS = {
  UPLOADED: "UPLOADED",
  PROCESSING: "PROCESSING",
  FILE_PROCESSING: "FILE_PROCESSING",
  MTQE_PROCESSING: "MTQE_PROCESSING",
  READY: "READY",
  FILE_ERROR: "FILE_ERROR",
  MTQE_ERROR: "MTQE_ERROR",
};

async function setProjectStatus(projectId, status) {
  await prisma.project.update({
    where: { id: projectId },
    data: { status },
  });
}

function parseProjectTmSettings(formData) {
  const requestedTmMode = formData.get("tm_mode") || "standard";
  const tmMode = ["standard", "smart"].includes(requestedTmMode)
    ? requestedTmMode
    : "standard";
  const parsedThreshold = Number.parseFloat(
    formData.get("tm_threshold") || "0.75",
  );
  const rawTmIds = formData.get("tm_ids");
  let tmIds = [];

  if (rawTmIds) {
    try {
      tmIds = JSON.parse(rawTmIds);
    } catch {
      throw new HttpError(400, "tm_ids must be a valid JSON array");
    }
  }

  const rawUpdateTmIds = formData.get("tm_update_ids");
  let updateTmIds = [];

  if (rawUpdateTmIds) {
    try {
      updateTmIds = JSON.parse(rawUpdateTmIds);
    } catch {
      throw new HttpError(400, "tm_update_ids must be a valid JSON array");
    }
  }

  return {
    tmMode,
    tmThreshold: Number.isFinite(parsedThreshold)
      ? Math.min(
          Math.max(
            parsedThreshold > 1 ? parsedThreshold / 100 : parsedThreshold,
            0,
          ),
          1,
        )
      : 0,
    tmIds: Array.isArray(tmIds) ? tmIds : [],
    updateTmIds: Array.isArray(updateTmIds) ? updateTmIds : [],
  };
}

function parseProjectGlossarySettings(formData) {
  const rawGlossaryIds = formData.get("glossary_ids");
  let glossaryIds = [];

  if (rawGlossaryIds) {
    try {
      glossaryIds = JSON.parse(rawGlossaryIds);
    } catch {
      throw new HttpError(400, "glossary_ids must be a valid JSON array");
    }
  }

  return {
    glossaryIds: Array.isArray(glossaryIds) ? glossaryIds : [],
  };
}

function normalizeTmIds(tmIds) {
  if (!Array.isArray(tmIds)) return [];
  return [...new Set(tmIds.filter((tmId) => typeof tmId === "string" && tmId))];
}

async function linkProjectTms(projectId, tmIds, updateTmIds = []) {
  const normalized = normalizeTmIds(tmIds);
  if (normalized.length === 0) return;

  const updateSet = new Set(normalizeTmIds(updateTmIds));

  await prisma.projectTm.createMany({
    data: normalized.map((tmId) => ({
      projectId,
      tmId,
      updateTm: updateSet.has(tmId),
    })),
    skipDuplicates: true,
  });
}

function normalizeGlossaryIds(glossaryIds) {
  if (!Array.isArray(glossaryIds)) return [];
  return [
    ...new Set(
      glossaryIds.filter(
        (glossaryId) => typeof glossaryId === "string" && glossaryId,
      ),
    ),
  ];
}

async function linkProjectGlossaries(projectId, glossaryIds) {
  const normalized = normalizeGlossaryIds(glossaryIds);
  if (normalized.length === 0) return;

  await prisma.projectGlossary.createMany({
    data: normalized.map((glossaryId) => ({ projectId, glossaryId })),
    skipDuplicates: true,
  });
}

// Document (non-SDLXLIFF) import: Okapi Tikal extracts the file to XLIFF
// with Okapi and returns the segments (sources with inline-code placeholders
// like <g1>…</g1>/<b1/> that must survive translation for the final merge).
// Enrichment (NexRelay MT with TM/glossary + MTQE score) runs here, with the
// same helper the SDLXLIFF pipeline uses. The storage/{documentId}/ working
// folder stays alive for the whole project lifetime: the export rebuilds the
// translated file from its XLIFF.
async function processDocumentFile({
  projectId,
  filePath,
  filename,
  src,
  tgt,
  mt,
  tmMode,
  tmThreshold,
  tmIds,
  glossaryIds,
}) {
  // A retried job re-extracts from scratch; drop the working folder the
  // previous attempt created so storage/ does not accumulate orphans.
  const previous = await prisma.project.findUnique({
    where: { id: projectId },
    select: { documentId: true },
  });
  if (previous?.documentId) {
    await deleteProjectDocumentService(previous.documentId).catch(() => {});
  }

  let extraction;
  try {
    extraction = await extractDocumentSegmentsService({
      filePath,
      filename,
      sourceLang: src || "en",
      targetLang: tgt || undefined,
    });
  } catch (error) {
    // Deterministic failures (unsupported/mismatched format, scanned PDF,
    // extraction timeout) will not change on a retry: fail the job on the
    // spot instead of re-uploading the file two more times.
    const deterministic =
      error?.code === "DOCUMENT_EXTRACTION_ERROR" ||
      error?.code === "DOCUMENT_EXTRACTION_TIMEOUT" ||
      (error?.status >= 400 && error?.status < 500);
    if (deterministic) {
      throw new UnrecoverableError(error.message);
    }
    throw error;
  }

  const { documentId, segments } = extraction;
  await linkProjectDocumentService(projectId, documentId);

  const working = segments.map((segment) => ({
    externalId: segment.id,
    source: segment.source,
    target: segment.target || null,
    locked: !segment.translatable,
  }));

  if (mt) {
    await enrichSdlxliffSegments(working, {
      sourceLanguage: src,
      targetLanguage: tgt,
      tmMode,
      tmThreshold,
      tmIds,
      glossaryIds,
    });
  }

  return working.map((segment, index) => ({
    externalId: segment.externalId,
    count: index,
    srcLiteral: segment.source,
    translatedLiteral: segment.target ?? null,
    translationScorePercent: segment.mtqeScore ?? null,
    tmInfo: segment.tmInfo ?? null,
    glossaryInfo: segment.glossaryInfo ?? null,
    block: segment.locked || segment.tmExactMatch === true,
    sourceLanguage: src ?? "",
    targetLanguage: tgt ?? "",
    Status:
      segment.locked || segment.tmExactMatch === true
        ? "ACCEPTED"
        : segment.machineTranslated
          ? "TRANSLATED_MT"
          : "NOT_REVIEWED",
    levenshteinDistance: segment.levenshteinDistance ?? null,
  }));
}

function toTusData(result, projectId) {
  return result.map((item) => {
    const data = {
      externalId: item.externalId ?? null,
      translationLiteralId: item.translationLiteralId ?? null,
      translationId: item.translationId ?? null,
      count: item.count ?? null,
      fieldName: item.fieldName ?? null,
      shortFieldname: item.shortFieldname ?? null,
      srcLiteral: item.srcLiteral,
      translatedLiteral: item.translatedLiteral ?? null,
      reviewLiteral: item.reviewLiteral ?? null,
      sourceLanguage: item.sourceLanguage,
      targetLanguage: item.targetLanguage,
      translationScorePercent:
        item.translationScorePercent ?? item.mtqe_score ?? null,
      exampleXml: item.exampleXml ?? null,
      Status: item.Status ?? "NOT_REVIEWED",
      levenshteinDistance: item.levenshteinDistance ?? null,
      block:
        typeof item.block === "boolean"
          ? item.block
          : typeof item.blocks === "boolean"
            ? item.blocks
            : false,
      belongTo: item.belongTo ?? null,
      projectId,
    };

    const tmInfo = item.tmInfo ?? item.tm_info ?? null;
    if (tmInfo !== null && tmInfo !== undefined) {
      data.tmInfo = tmInfo;
    }

    const glossaryInfo = item.glossaryInfo ?? item.glossary_info ?? null;
    if (glossaryInfo !== null && glossaryInfo !== undefined) {
      data.glossaryInfo = glossaryInfo;
    }

    return data;
  });
}

export function resolveProjectErrorStatus(error) {
  if (error?.code === "MTQE_ERROR") return PROJECT_STATUS.MTQE_ERROR;
  return PROJECT_STATUS.FILE_ERROR;
}

// Queue handlers throw on failure so BullMQ retries with backoff; the final
// failure is turned into an error status by the worker (see import-worker.js).
// A retried job re-runs from scratch, so every handler clears the project TUs
// first to stay idempotent.
async function resetProjectTus(projectId) {
  await prisma.tu.deleteMany({ where: { projectId } });
}

// SDLXLIFF import pipeline:
//  1. Read source + target per segment from the file itself; keep the
//     trans-unit/mrk ids in `externalId` (needed for a lossless export) and
//     block the segments marked as locked in <sdl:seg-defs>.
//  2/3. In parallel: machine-translate with NexRelay the unlocked segments
//     without target, and score with MTQE the unlocked ones that already have
//     a target (see enrichSdlxliffSegments).
export async function handleSdlxliffImportJob({
  projectId,
  filePath,
  src,
  tgt,
  tmMode,
  tmThreshold,
  tmIds,
  glossaryIds,
}) {
  await resetProjectTus(projectId);
  await setProjectStatus(projectId, PROJECT_STATUS.PROCESSING);

  const { sourceLanguage, targetLanguage, segments } = await parseSdlxliffFile(filePath);

  const normalizedSrc = src || sourceLanguage;
  const normalizedTgt = tgt || targetLanguage;

  if (!normalizedSrc) {
    throw new Error("No source language provided (missing in file and upload)");
  }
  if (!normalizedTgt) {
    throw new Error(
      "No target language: SDLXLIFF has no target-language; select one on upload",
    );
  }

  console.log("[SDLXLIFF] parsed", {
    projectId,
    src: normalizedSrc,
    tgt: normalizedTgt,
    segments: segments.length,
    locked: segments.filter((s) => s.locked).length,
  });

  const { translated, scored } = await enrichSdlxliffSegments(segments, {
    sourceLanguage: normalizedSrc,
    targetLanguage: normalizedTgt,
    tmMode,
    tmThreshold,
    tmIds,
    glossaryIds,
  });

  console.log("[SDLXLIFF] enriched", {
    projectId,
    translatedWithNexRelay: translated,
    scoredWithMtqe: scored,
  });

  const tusData = buildTusDataFromSdlxliffSegments(
    segments,
    projectId,
    normalizedSrc,
    normalizedTgt,
  );

  await prisma.tu.createMany({
    data: tusData,
  });

  await setProjectStatus(projectId, PROJECT_STATUS.READY);
}

export async function handleUploadImportJob({
  projectId,
  filePath,
  filename,
  mt,
  src,
  tgt,
  tmMode,
  tmThreshold,
  tmIds,
  glossaryIds,
}) {
  await resetProjectTus(projectId);
  await setProjectStatus(projectId, PROJECT_STATUS.FILE_PROCESSING);
  const result = await processDocumentFile({
    projectId,
    filePath,
    filename,
    src,
    tgt,
    mt,
    tmMode,
    tmThreshold,
    tmIds,
    glossaryIds,
  });

  await prisma.tu.createMany({
    data: toTusData(result, projectId),
  });
  await setProjectStatus(projectId, PROJECT_STATUS.READY);
}

// If Redis is down the job cannot be scheduled: mark the project as failed
// (instead of leaving it stuck in UPLOADED) and surface the 503 to the caller.
async function enqueueImportJobOrFail(jobName, data) {
  try {
    await enqueueProjectImport(jobName, data);
  } catch (error) {
    await setProjectStatus(data.projectId, PROJECT_STATUS.FILE_ERROR).catch(
      () => {},
    );
    throw error;
  }
}

export async function importProjectsFromUploadService({
  formData,
  userId,
  workspaceId,
}) {
  if (!workspaceId) {
    throw new HttpError(400, "A workspace is required to import a project");
  }

  const files = formData.getAll("file");
  const mt = formData.get("mt") === "true";
  const src = formData.get("src");
  const tgt = formData.get("tgt");
  const tmSettings = parseProjectTmSettings(formData);
  const glossarySettings = parseProjectGlossarySettings(formData);
  const [validTmIds, validGlossaryIds] = await Promise.all([
    findValidTmIdsInWorkspace(tmSettings.tmIds, workspaceId),
    findValidGlossaryIdsInWorkspace(glossarySettings.glossaryIds, workspaceId),
  ]);

  if (files.length === 0) {
    throw new HttpError(400, "No file uploaded");
  }

  const createdProjectIds = [];
  for (const file of files) {
    if (!file || !file.name) continue;

    const fileName = file.name.trim().replace(/\s+/g, "");
    const fileExtension = fileName.split(".").pop().toLowerCase();

    if (!checkFile(file)) {
      throw new HttpError(400, "The file type is not allowed");
    }

    const filePath = `./public/files/${uid()}_${file.name}`;
    await pump(file.stream(), fs.createWriteStream(filePath));

    const createdProject = await prisma.project.create({
      data: {
        filename: file.name.trim(),
        userId,
        workspaceId,
        filePath,
        mt,
        tmMode: tmSettings.tmMode,
        tmThreshold: tmSettings.tmThreshold,
        extension: fileExtension,
        sourceLanguage: src,
        targetLanguage: tgt,
        status: PROJECT_STATUS.UPLOADED,
      },
    });

    await linkProjectTms(
      createdProject.id,
      validTmIds,
      tmSettings.updateTmIds,
    );
    await linkProjectGlossaries(createdProject.id, validGlossaryIds);

    createdProjectIds.push(createdProject.id);

    if (fileExtension === "sdlxliff") {
      await enqueueImportJobOrFail("import-sdlxliff", {
        projectId: createdProject.id,
        filePath,
        src,
        tgt,
        tmMode: tmSettings.tmMode,
        tmThreshold: tmSettings.tmThreshold,
        tmIds: validTmIds,
        glossaryIds: validGlossaryIds,
      });
    } else {
      await enqueueImportJobOrFail("import-upload", {
        projectId: createdProject.id,
        filePath,
        filename: file.name.trim(),
        mt,
        src,
        tgt,
        tmMode: tmSettings.tmMode,
        tmThreshold: tmSettings.tmThreshold,
        tmIds: validTmIds,
        glossaryIds: validGlossaryIds,
      });
    }
  }

  return { projectIds: createdProjectIds };
}
