import axios from "axios";
import contentDisposition from "content-disposition";
import fs from "fs";
import { pipeline } from "stream";
import { uid } from "uid";
import { promisify } from "util";
import zlib from "zlib";
import prisma from "../../lib/prisma";
import {
  checkFile,
  oxygenTranslateFile,
  postMTQE,
  segmentTexts,
  translateTexts,
} from "../../lib/utils";
import { HttpError } from "../shared/http-error";
import { findValidGlossaryIdsInWorkspace, findValidTmIdsInWorkspace } from "./repository";
import oxigenResponse from "@/oxigen_response.json";

const pump = promisify(pipeline);
const PROJECT_STATUS = {
  UPLOADED: "UPLOADED",
  PROCESSING: "PROCESSING",
  OXIGEN_PROCESSING: "OXIGEN_PROCESSING",
  MTQE_PROCESSING: "MTQE_PROCESSING",
  READY: "READY",
  OXIGEN_ERROR: "OXIGEN_ERROR",
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

async function linkProjectTms(projectId, tmIds) {
  const normalized = normalizeTmIds(tmIds);
  if (normalized.length === 0) return;

  await prisma.projectTm.createMany({
    data: normalized.map((tmId) => ({ projectId, tmId })),
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

function normalizeProjectSegmentsPayload(payload, { src, tgt } = {}) {
  const segments = Array.isArray(payload?.segments)
    ? payload.segments
    : Array.isArray(payload)
      ? payload
      : [];

  return segments.map((item, index) => {
    if (item.src !== undefined || item.tgt !== undefined) {
      return {
        externalId: item.id ?? item.externalId ?? null,
        count: item.count ?? index,
        srcLiteral: item.src ?? "",
        translatedLiteral: item.tgt ?? null,
        translationScorePercent:
          item.mtqe_score ?? item.translationScorePercent ?? null,
        sourceLanguage: item.sourceLanguage ?? src ?? "",
        targetLanguage: item.targetLanguage ?? tgt ?? "",
        Status: item.Status ?? "NOT_REVIEWED",
        tmInfo: item.tm_info ?? item.tmInfo ?? null,
        block:
          typeof item.block === "boolean"
            ? item.block
            : typeof item.blocks === "boolean"
              ? item.blocks
              : false,
      };
    }

    return {
      ...item,
      tmInfo: item.tm_info ?? item.tmInfo ?? null,
      translationScorePercent:
        item.mtqe_score ?? item.translationScorePercent ?? null,
      sourceLanguage: item.sourceLanguage ?? src ?? "",
      targetLanguage: item.targetLanguage ?? tgt ?? "",
      block:
        typeof item.block === "boolean"
          ? item.block
          : typeof item.blocks === "boolean"
            ? item.blocks
            : false,
    };
  });
}

async function processJsonWithOptionalMt(jsonData, mt, { src, tgt } = {}) {
  jsonData = normalizeProjectSegmentsPayload(jsonData, { src, tgt });
  let result = [];
  const textsToSegment = {};

  jsonData.forEach((item) => {
    if (!item.translatedLiteral) {
      const languageKey = `${item.sourceLanguage}-${item.targetLanguage}`;
      if (!textsToSegment[languageKey]) {
        textsToSegment[languageKey] = [];
      }
      textsToSegment[languageKey].push(item);
    }
  });

  const segmentedTexts = {};
  const mtTexts = {};

  if (mt) {
    await Promise.all(
      Object.entries(textsToSegment).map(async ([language, items]) => {
        const [srcLang] = language.split("-");
        segmentedTexts[language] = await segmentTexts(
          srcLang,
          items.map((item) => item.srcLiteral),
        );
      }),
    );

    await Promise.all(
      Object.keys(segmentedTexts).map(async (language1) => {
        const [srcLangForTranslation, tgtLang] = language1.split("-");
        const aux = [];

        segmentedTexts[language1].segments.forEach((segment, index) => {
          segment.forEach((s) => {
            aux.push(
              textsToSegment[language1][index].srcLiteral
                .substring(s.start, s.stop)
                .trim(),
            );
          });
        });

        mtTexts[language1] = await translateTexts(
          srcLangForTranslation,
          tgtLang,
          aux,
        );
      }),
    );
  } else {
    // Keep same shape for non-MT flow and avoid undefined access.
    await Promise.all(
      Object.entries(textsToSegment).map(async ([language, items]) => {
        const [srcLang] = language.split("-");
        segmentedTexts[language] = await segmentTexts(
          srcLang,
          items.map((item) => item.srcLiteral),
        );
      }),
    );
  }

  const segmentIndices = {};
  jsonData.forEach((item) => {
    if (!item.translatedLiteral) {
      const language = `${item.sourceLanguage}-${item.targetLanguage}`;
      if (!segmentIndices[language]) {
        segmentIndices[language] = 0;
      }

      const segments =
        segmentedTexts[language].segments[segmentIndices[language]];
      segmentIndices[language]++;

      segments.forEach((segment, index) => {
        result.push({
          ...item,
          id: `${item.id}-${index}`,
          srcLiteral: item.srcLiteral
            .substring(segment.start, segment.stop)
            .trim(),
          belongTo: item.id,
          Status: "TRANSLATED_MT",
          translatedLiteral: mt
            ? mtTexts[language].translations[index].tgt
            : null,
          translationScorePercent: mt
            ? mtTexts[language].translations[index].score
            : null,
        });
      });
    } else {
      result.push(item);
    }
  });

  return result;
}

async function processNonJsonFile({
  filePath,
  src,
  tgt,
  mt,
  tmMode,
  tmThreshold,
  tmIds,
  glossaryIds,
  userId,
  workspaceId,
}) {
  const objectOxigen = {
    filePath,
    src_lang: src || "en",
    tgt_lang: tgt || null,
    mt,
    tm_mode: tmMode,
    tm_threshold: tmThreshold,
    tm_ids: tmIds,
    glossary_ids: glossaryIds,
    user_id: userId,
    workspace_id: workspaceId,
  };

  const tmp = await oxygenTranslateFile(objectOxigen);
  if (!tmp) {
    const error = new Error("Internal error with Oxigen");
    error.code = "OXIGEN_ERROR";
    throw error;
  }

  /** Simulación local: mismo envelope que Oxigen (`data.trans_units`). */
  // const tmp = oxigenResponse.trans_units;

  return tmp.map((item, index) => ({
    externalId: null,
    count: index,
    srcLiteral: item.src ?? item.mt_segment ?? "",
    translatedLiteral: item.tgt ?? item.source_segment ?? null,
    translationScorePercent: item.mtqe_score ?? null,
    tmInfo: item.tm_info ?? item.tmInfo ?? null,
    glossaryInfo: item.glossary_info ?? item.glossaryInfo ?? null,
    block: (() => {
      const tmInfoArray = item.tm_info ?? item.tmInfo ?? [];
      if (Array.isArray(tmInfoArray)) {
        const bestTm = tmInfoArray.find((tm) => tm.tm_match === true);
        if (bestTm && bestTm.tm_score == 1) {
          return true;
        }
      }
      return false;
    })(),
    sourceLanguage: src ?? "",
    targetLanguage: tgt ?? "",
    Status: (() => {
      const tmInfoArray = item.tm_info ?? item.tmInfo ?? [];
      if (Array.isArray(tmInfoArray)) {
        const bestTm = tmInfoArray.find((tm) => tm.tm_match === true);
        if (bestTm && bestTm.tm_score == 1) {
          return "ACCEPTED";
        }
      }
      return "NOT_REVIEWED";
    })(),
    levenshteinDistance: (() => {
      const tmInfoArray = item.tm_info ?? item.tmInfo ?? [];
      if (Array.isArray(tmInfoArray)) {
        const bestTm = tmInfoArray.find((tm) => tm.tm_match === true);
        if (bestTm && typeof bestTm.tm_score === "number") {
          return bestTm.tm_score;
        }
      }
      return null;
    })(),
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

function resolveProjectErrorStatus(fileExtension, error) {
  if (error?.code === "MTQE_ERROR") return PROJECT_STATUS.MTQE_ERROR;
  if (fileExtension === "json") return PROJECT_STATUS.MTQE_ERROR;
  return PROJECT_STATUS.OXIGEN_ERROR;
}

async function processUploadedProjectInBackground({
  projectId,
  filePath,
  fileExtension,
  mt,
  src,
  tgt,
  tmMode,
  tmThreshold,
  tmIds,
  glossaryIds,
  userId,
  workspaceId,
}) {
  try {
    let result = [];
    if (fileExtension === "json") {
      await setProjectStatus(projectId, PROJECT_STATUS.PROCESSING);
      const jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      result = await processJsonWithOptionalMt(jsonData, mt, { src, tgt });
    } else {
      await setProjectStatus(projectId, PROJECT_STATUS.OXIGEN_PROCESSING);
      result = await processNonJsonFile({
        filePath,
        src,
        tgt,
        mt,
        tmMode,
        tmThreshold,
        tmIds,
        glossaryIds,
        userId,
        workspaceId,
      });
    }

    await prisma.tu.createMany({
      data: toTusData(result, projectId),
    });
    await setProjectStatus(projectId, PROJECT_STATUS.READY);
  } catch (error) {
    console.error("Error processing project in background:", error);
    const status = resolveProjectErrorStatus(fileExtension, error);
    await setProjectStatus(projectId, status).catch(() => {});
  }
}

async function processUrlProjectInBackground({
  projectId,
  decompressedFilePath,
}) {
  try {
    await setProjectStatus(projectId, PROJECT_STATUS.PROCESSING);
    const data = fs.readFileSync(decompressedFilePath, "utf8");
    const jsonData = JSON.parse(data);

    const result = normalizeProjectSegmentsPayload(jsonData);
    await prisma.tu.createMany({
      data: toTusData(result, projectId),
      skipDuplicates: true,
    });

    await setProjectStatus(projectId, PROJECT_STATUS.READY);
  } catch (error) {
    console.error("Error processing URL project in background:", error);
    await setProjectStatus(projectId, PROJECT_STATUS.MTQE_ERROR).catch(
      () => {},
    );
  }
}

export async function importProjectFromUrlService(url, userId, workspaceId) {
  if (!workspaceId) {
    throw new HttpError(400, "A workspace is required to import a project");
  }
  let response = null;
  try {
    response = await axios({
      method: "get",
      url,
      responseType: "stream",
    });
  } catch {
    throw new HttpError(500, "The URL is not reachable");
  }

  let fileName = "downloaded-file";
  const contentDispositionHeader = response.headers["content-disposition"];
  if (contentDispositionHeader) {
    fileName = contentDisposition.parse(contentDispositionHeader).parameters
      .filename;
  }

  const newFolder = Date.now();
  const folderPath = `./public/files/${newFolder}`;
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  const downloadPath = `${folderPath}/${fileName}`;
  const writer = fs.createWriteStream(downloadPath);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  const decompressedFilePath = `${downloadPath}.json`;
  const readStream = fs.createReadStream(downloadPath);
  const writeStream = fs.createWriteStream(decompressedFilePath);
  const unzip = zlib.createGunzip();
  readStream.pipe(unzip).pipe(writeStream);

  await new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  const createdProject = await prisma.project.create({
    data: {
      filename: fileName.trim(),
      userId,
      workspaceId,
      filePath: decompressedFilePath,
      extension: "json",
      status: PROJECT_STATUS.UPLOADED,
    },
  });

  void processUrlProjectInBackground({
    projectId: createdProject.id,
    decompressedFilePath,
  });

  return createdProject;
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

    await linkProjectTms(createdProject.id, validTmIds);
    await linkProjectGlossaries(createdProject.id, validGlossaryIds);

    createdProjectIds.push(createdProject.id);
    void processUploadedProjectInBackground({
      projectId: createdProject.id,
      filePath,
      fileExtension,
      mt,
      src,
      tgt,
      tmMode: tmSettings.tmMode,
      tmThreshold: tmSettings.tmThreshold,
      tmIds: validTmIds,
      glossaryIds: validGlossaryIds,
      userId,
      workspaceId,
    });
  }

  return { projectIds: createdProjectIds };
}
