import fs from "fs";
import { pipeline } from "stream";
import { uid } from "uid";
import { promisify } from "util";
import prisma from "../../lib/prisma";
import { checkFile } from "../../lib/utils";
import { enqueueMtqeV1, enqueueProjectImport } from "../../lib/queue";
import { DOCUMENT_STATUS } from "../../lib/document-status";
import { HttpError } from "../shared/http-error";
import { assertWorkspaceAssetAccess } from "../shared/roles";
import {
  findValidGlossaryIdsInWorkspace,
  findValidTmIdsInWorkspace,
} from "./repository";
// Direct file import on purpose: the barrels of modules/projects and
// modules/documents reference each other, so going through them here would
// close an import cycle before the bindings are initialized.
import { findProjectWithProfileForActor } from "../projects/repository";
import { getProfileDaait } from "../profiles/daait-repository";
import { Prisma } from "@prisma/client";
import { UnrecoverableError } from "bullmq";
import {
  deleteProjectDocumentService,
  extractDocumentSegmentsService,
  linkProjectDocumentService,
} from "@/modules/extraction";
import {
  parseSdlxliffFile,
  enrichSdlxliffSegments,
  buildTusDataFromSdlxliffSegments,
} from "./sdlxliff-service";
import { PIPELINE_SCORE_JOB } from "./pipeline-service";
import { BLOCK_REASON, profileMatchesLanguagePair } from "./pipeline-constants";
import { resolveHiddenBy } from "./visibility-rules";

const pump = promisify(pipeline);

async function setDocumentStatus(documentId, status) {
  await prisma.document.update({
    where: { id: documentId },
    data: { status },
  });
}

function normalizeIds(ids) {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.filter((id) => typeof id === "string" && id))];
}

async function linkDocumentTms(documentId, tmIds, updateTmIds = []) {
  const normalized = normalizeIds(tmIds);
  if (normalized.length === 0) return;

  const updateSet = new Set(normalizeIds(updateTmIds));

  await prisma.documentTm.createMany({
    data: normalized.map((tmId) => ({
      documentId,
      tmId,
      updateTm: updateSet.has(tmId),
    })),
    skipDuplicates: true,
  });
}

async function linkDocumentGlossaries(documentId, glossaryIds) {
  const normalized = normalizeIds(glossaryIds);
  if (normalized.length === 0) return;

  await prisma.documentGlossary.createMany({
    data: normalized.map((glossaryId) => ({ documentId, glossaryId })),
    skipDuplicates: true,
  });
}

// Document (non-SDLXLIFF) import: Okapi Tikal extracts the file to XLIFF
// with Okapi and returns the segments (sources with inline-code placeholders
// like <g1>…</g1>/<b1/> that must survive translation for the final merge).
// Enrichment (DAAIT /content/pecat MT with TM/glossary) runs here, with the
// same helper the SDLXLIFF pipeline uses. The storage/{documentId}/ working
// folder stays alive for the whole document lifetime: the export rebuilds the
// translated file from its XLIFF.
async function processDocumentFile({
  documentId,
  filePath,
  filename,
  src,
  tgt,
  mt,
  tmIds,
  glossaryIds,
  profileId,
  workspaceId,
}) {
  // A retried job re-extracts from scratch; drop the working folder the
  // previous attempt created so storage/ does not accumulate orphans.
  const previous = await prisma.document.findUnique({
    where: { id: documentId },
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

  const { documentId: storageId, segments } = extraction;
  await linkProjectDocumentService(documentId, storageId);

  // hiddenBy is resolved BEFORE enrichment so hidden segments are never sent
  // to DAAIT/MTQE (enrichSdlxliffSegments skips them).
  const working = segments.map((segment) => ({
    externalId: segment.id,
    source: segment.source,
    target: segment.target || null,
    locked: !segment.translatable,
    hiddenBy: resolveHiddenBy(segment.source),
  }));

  if (mt) {
    await enrichSdlxliffSegments(working, {
      sourceLanguage: src,
      targetLanguage: tgt,
      tmIds,
      glossaryIds,
      profileId,
      workspaceId,
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
    visible: !segment.hiddenBy,
    hiddenBy: segment.hiddenBy ?? null,
    block: segment.locked || segment.tmExactMatch === true,
    blockReason: segment.locked
      ? BLOCK_REASON.INTERNAL
      : segment.tmExactMatch === true
        ? BLOCK_REASON.TM_MATCH
        : null,
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

function toTusData(result, documentId) {
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
      visible: item.visible !== false,
      hiddenBy: item.hiddenBy ?? null,
      blockReason: item.blockReason ?? null,
      block:
        typeof item.block === "boolean"
          ? item.block
          : typeof item.blocks === "boolean"
            ? item.blocks
            : false,
      belongTo: item.belongTo ?? null,
      documentId,
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

export function resolveDocumentErrorStatus(error) {
  if (error?.code === "MTQE_ERROR") return DOCUMENT_STATUS.MTQE_ERROR;
  return DOCUMENT_STATUS.FILE_ERROR;
}

// Queue handlers throw on failure so BullMQ retries with backoff; the final
// failure is turned into an error status by the worker (see import-worker.js).
// A retried job re-runs from scratch, so every handler clears the document TUs
// first to stay idempotent (and drops the previous run's pipeline telemetry).
async function resetDocumentTus(documentId) {
  await prisma.tu.deleteMany({ where: { documentId } });
  await prisma.document.update({
    where: { id: documentId },
    data: { pipelineStats: Prisma.DbNull },
  });
}

// NOTE: the job payload key is still `projectId` (it carries the document row
// id). Kept for compatibility with jobs already sitting in Redis when this
// code deploys — do not rename it or the queue/job names.

// SDLXLIFF import pipeline:
//  1. Read source + target per segment from the file itself; keep the
//     trans-unit/mrk ids in `externalId` (needed for a lossless export) and
//     block the segments marked as locked in <sdl:seg-defs>.
//  2. Machine-translate with DAAIT /content/pecat the unlocked segments
//     without target, and score with MTQE the unlocked ones that already have
//     a target (see enrichSdlxliffSegments).
export async function handleSdlxliffImportJob({
  projectId: documentId,
  filePath,
  src,
  tgt,
  tmIds,
  glossaryIds,
  profileId,
  workspaceId,
}) {
  await resetDocumentTus(documentId);
  await setDocumentStatus(documentId, DOCUMENT_STATUS.PROCESSING);

  const { sourceLanguage, targetLanguage, segments } =
    await parseSdlxliffFile(filePath);

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

  // Resolved BEFORE enrichment so hidden segments skip DAAIT/MTQE.
  for (const segment of segments) {
    segment.hiddenBy = resolveHiddenBy(segment.source);
  }

  console.log("[SDLXLIFF] parsed", {
    documentId,
    src: normalizedSrc,
    tgt: normalizedTgt,
    segments: segments.length,
    locked: segments.filter((s) => s.locked).length,
    hidden: segments.filter((s) => s.hiddenBy).length,
  });

  const { translated } = await enrichSdlxliffSegments(segments, {
    sourceLanguage: normalizedSrc,
    targetLanguage: normalizedTgt,
    tmIds,
    glossaryIds,
    profileId,
    workspaceId,
  });

  console.log("[SDLXLIFF] enriched", {
    documentId,
    translatedWithDaait: translated,
  });

  const tusData = buildTusDataFromSdlxliffSegments(
    segments,
    documentId,
    normalizedSrc,
    normalizedTgt,
  );

  await prisma.tu.createMany({
    data: tusData,
  });

  await chainScoreStage(documentId);
}

export async function handleUploadImportJob({
  projectId: documentId,
  filePath,
  filename,
  mt,
  src,
  tgt,
  tmIds,
  glossaryIds,
  profileId,
  workspaceId,
}) {
  await resetDocumentTus(documentId);
  await setDocumentStatus(documentId, DOCUMENT_STATUS.FILE_PROCESSING);
  const result = await processDocumentFile({
    documentId,
    filePath,
    filename,
    src,
    tgt,
    mt,
    tmIds,
    glossaryIds,
    profileId,
    workspaceId,
  });

  await prisma.tu.createMany({
    data: toTusData(result, documentId),
  });
  await chainScoreStage(documentId);
}

// The document turns READY inside the score stage; if the stage cannot even
// be enqueued, release the document directly rather than leaving it stuck.
async function chainScoreStage(documentId) {
  try {
    await enqueueMtqeV1(PIPELINE_SCORE_JOB, { projectId: documentId });
  } catch (error) {
    console.error(
      `[import] could not enqueue MTQE scoring for ${documentId}, releasing as READY:`,
      error.message,
    );
    await setDocumentStatus(documentId, DOCUMENT_STATUS.READY);
  }
}

// If Redis is down the job cannot be scheduled: mark the document as failed
// (instead of leaving it stuck in UPLOADED) and surface the 503 to the caller.
async function enqueueImportJobOrFail(jobName, data) {
  try {
    await enqueueProjectImport(jobName, data);
  } catch (error) {
    await setDocumentStatus(data.projectId, DOCUMENT_STATUS.FILE_ERROR).catch(
      () => {},
    );
    throw error;
  }
}

// null = the field was not sent (default: all); [] = explicitly none.
function parseIdList(formData, field) {
  const raw = formData.get(field);
  if (raw === null || raw === undefined || raw === "") return null;
  let ids;
  try {
    ids = JSON.parse(raw);
  } catch {
    throw new HttpError(400, `${field} must be a valid JSON array`);
  }
  return normalizeIds(ids);
}

// A document takes the TMs and glossaries of its project's profile (only the
// ones DAAIT has ready), materialized at upload time. tm_ids/glossary_ids pick
// which of them apply: absent = all of them (the default), [] = none. Ids
// outside the profile are ignored. DAAIT /content/pecat (with a profile)
// applies exactly the ids it receives — none for an empty list — so the
// selection travels as is.
async function resolveDocumentAssets(project, formData) {
  const profileTmIds =
    project.profile?.profileTms?.map((link) => link.tmId) ?? [];
  const profileGlossaryIds =
    project.profile?.profileGlossaries?.map((link) => link.glossaryId) ?? [];

  // Profile assets were SUCCESS when attached, but one may be rebuilding
  // (re-import) right now — drop it rather than block the whole upload.
  const [readyTmIds, readyGlossaryIds] = await Promise.all([
    findValidTmIdsInWorkspace(profileTmIds, project.workspaceId),
    findValidGlossaryIdsInWorkspace(profileGlossaryIds, project.workspaceId),
  ]);

  const pick = (ready, requested) =>
    requested === null ? ready : ready.filter((id) => requested.includes(id));

  return {
    tmIds: pick(readyTmIds, parseIdList(formData, "tm_ids")),
    glossaryIds: pick(readyGlossaryIds, parseIdList(formData, "glossary_ids")),
  };
}

const PROFILE_CHECK_TIMEOUT_MS = 10_000;

// Documents are always translated with the project's profile — never without
// it. Fail the upload with a clear reason instead of translating unprofiled:
// no profile (or a deleted one), a legacy profile bound to another language
// pair, or a profile whose DAAIT mirror no longer exists. A DAAIT outage is
// not a reason to reject: the queued job retries the translation.
async function resolveTranslationProfile(project, src, tgt) {
  const profile =
    project.profile && !project.profile.deletedAt ? project.profile : null;
  if (!profile) {
    throw new HttpError(
      409,
      "Assign a profile to the project before uploading documents",
      "PROFILE_REQUIRED",
    );
  }
  if (!profileMatchesLanguagePair(profile, src, tgt)) {
    throw new HttpError(
      409,
      `The profile "${profile.name}" only translates ${profile.sourceLanguage ?? "?"} -> ${profile.targetLanguage}; change the project profile or the language pair`,
      "PROFILE_LANGUAGE_MISMATCH",
    );
  }
  try {
    await getProfileDaait(profile.id, { timeout: PROFILE_CHECK_TIMEOUT_MS });
  } catch (error) {
    if (error?.status === 404) {
      throw new HttpError(
        409,
        `The profile "${profile.name}" does not exist in DAAIT: open the profile and save it to recreate it`,
        "PROFILE_NOT_IN_DAAIT",
      );
    }
    console.warn(
      `[import] could not check profile ${profile.id} in DAAIT, continuing:`,
      error?.message,
    );
  }
  return profile;
}

export async function importDocumentsService({
  formData,
  projectId,
  actorUser,
}) {
  // Uploading is a management action: USER only ever works documents it's
  // already assigned to, it never creates new ones.
  assertWorkspaceAssetAccess(actorUser);

  const project = await findProjectWithProfileForActor(projectId, actorUser);
  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  const files = formData.getAll("file");
  const mt = formData.get("mt") === "true";
  const src = formData.get("src");
  const tgt = formData.get("tgt");
  const profile = await resolveTranslationProfile(project, src, tgt);
  const assets = await resolveDocumentAssets(project, formData);

  if (files.length === 0) {
    throw new HttpError(400, "No file uploaded");
  }

  const createdDocumentIds = [];
  for (const file of files) {
    if (!file || !file.name) continue;

    const fileName = file.name.trim().replace(/\s+/g, "");
    const fileExtension = fileName.split(".").pop().toLowerCase();

    if (!checkFile(file)) {
      throw new HttpError(400, "The file type is not allowed");
    }

    const filePath = `./public/files/${uid()}_${file.name}`;
    await pump(file.stream(), fs.createWriteStream(filePath));

    const createdDocument = await prisma.document.create({
      data: {
        filename: file.name.trim(),
        userId: actorUser.id,
        workspaceId: project.workspaceId,
        projectId: project.id,
        filePath,
        mt,
        extension: fileExtension,
        sourceLanguage: src,
        targetLanguage: tgt,
        status: DOCUMENT_STATUS.UPLOADED,
      },
    });

    await linkDocumentTms(createdDocument.id, assets.tmIds);
    await linkDocumentGlossaries(createdDocument.id, assets.glossaryIds);

    createdDocumentIds.push(createdDocument.id);

    if (fileExtension === "sdlxliff") {
      await enqueueImportJobOrFail("import-sdlxliff", {
        projectId: createdDocument.id,
        filePath,
        src,
        tgt,
        tmIds: assets.tmIds,
        glossaryIds: assets.glossaryIds,
        profileId: profile.id,
        workspaceId: project.workspaceId,
      });
    } else {
      await enqueueImportJobOrFail("import-upload", {
        projectId: createdDocument.id,
        filePath,
        filename: file.name.trim(),
        mt,
        src,
        tgt,
        tmIds: assets.tmIds,
        glossaryIds: assets.glossaryIds,
        profileId: profile.id,
        workspaceId: project.workspaceId,
      });
    }
  }

  return { documentIds: createdDocumentIds };
}
