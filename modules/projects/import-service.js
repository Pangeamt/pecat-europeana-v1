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

async function processJsonWithOptionalMt(jsonData, mt) {
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
    for (const language in textsToSegment) {
      const [srcLang] = language.split("-");
      segmentedTexts[language] = await segmentTexts(
        srcLang,
        textsToSegment[language].map((item) => item.srcLiteral)
      );

      for (const language1 in segmentedTexts) {
        const [srcLangForTranslation, tgtLang] = language1.split("-");
        const aux = [];

        segmentedTexts[language1].segments.forEach((segment, index) => {
          segment.forEach((s) => {
            aux.push(
              textsToSegment[language1][index].srcLiteral
                .substring(s.start, s.stop)
                .trim()
            );
          });
        });

        mtTexts[language1] = await translateTexts(
          srcLangForTranslation,
          tgtLang,
          aux
        );
      }
    }
  } else {
    // Keep same shape for non-MT flow and avoid undefined access.
    for (const language in textsToSegment) {
      const [srcLang] = language.split("-");
      segmentedTexts[language] = await segmentTexts(
        srcLang,
        textsToSegment[language].map((item) => item.srcLiteral)
      );
    }
  }

  const segmentIndices = {};
  jsonData.forEach((item) => {
    if (!item.translatedLiteral) {
      const language = `${item.sourceLanguage}-${item.targetLanguage}`;
      if (!segmentIndices[language]) {
        segmentIndices[language] = 0;
      }

      const segments = segmentedTexts[language].segments[segmentIndices[language]];
      segmentIndices[language]++;

      segments.forEach((segment, index) => {
        result.push({
          ...item,
          id: `${item.id}-${index}`,
          srcLiteral: item.srcLiteral.substring(segment.start, segment.stop).trim(),
          belongTo: item.id,
          Status: "TRANSLATED_MT",
          translatedLiteral: mt ? mtTexts[language].translations[index].tgt : null,
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

async function processNonJsonFile({ filePath, src, tgt, mt, onBeforeMTQE }) {
  const objectOxigen = {
    filePath,
    src_lang: src || "en",
    tgt_lang: tgt || null,
    mt,
  };

  const tmp = await oxygenTranslateFile(objectOxigen);
  if (!tmp) {
    const error = new Error("Internal error with Oxigen");
    error.code = "OXIGEN_ERROR";
    throw error;
  }

  const objectMTQE = tmp.map((item) => ({
    mt_segment: item.src,
    source_segment: item.tgt,
  }));

  await onBeforeMTQE?.();

  let responseMTQE = null;
  try {
    responseMTQE = await postMTQE({ pairs: objectMTQE });
  } catch {
    const error = new Error("Internal error with MTQE");
    error.code = "MTQE_ERROR";
    throw error;
  }

  if (!responseMTQE) {
    const error = new Error("Internal error with MTQE");
    error.code = "MTQE_ERROR";
    throw error;
  }

  return responseMTQE.pairs.map((item, index) => ({
    externalId: null,
    count: index,
    srcLiteral: item.mt_segment,
    translatedLiteral: item.source_segment,
    translationScorePercent: item.mtqe_score,
    sourceLanguage: src,
    targetLanguage: tgt,
    Status: "NOT_REVIEWED",
  }));
}

function toTusData(result, projectId) {
  return result.map((item) => {
    const { id, ...rest } = item;
    return {
      ...rest,
      projectId,
    };
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
}) {
  try {
    let result = [];
    if (fileExtension === "json") {
      await setProjectStatus(projectId, PROJECT_STATUS.PROCESSING);
      const jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      result = await processJsonWithOptionalMt(jsonData, mt);
    } else {
      await setProjectStatus(projectId, PROJECT_STATUS.OXIGEN_PROCESSING);
      result = await processNonJsonFile({
        filePath,
        src,
        tgt,
        mt,
        onBeforeMTQE: async () => {
          await setProjectStatus(projectId, PROJECT_STATUS.MTQE_PROCESSING);
        },
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

async function processUrlProjectInBackground({ projectId, decompressedFilePath }) {
  try {
    await setProjectStatus(projectId, PROJECT_STATUS.PROCESSING);
    const data = fs.readFileSync(decompressedFilePath, "utf8");
    const jsonData = JSON.parse(data);

    await prisma.tu.createMany({
      data: jsonData.map((item) => ({
        ...item,
        projectId,
      })),
      skipDuplicates: true,
    });

    await setProjectStatus(projectId, PROJECT_STATUS.READY);
  } catch (error) {
    console.error("Error processing URL project in background:", error);
    await setProjectStatus(projectId, PROJECT_STATUS.MTQE_ERROR).catch(() => {});
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
    fileName = contentDisposition.parse(contentDispositionHeader).parameters.filename;
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
        extension: fileExtension,
        sourceLanguage: src,
        targetLanguage: tgt,
        status: PROJECT_STATUS.UPLOADED,
      },
    });

    createdProjectIds.push(createdProject.id);
    void processUploadedProjectInBackground({
      projectId: createdProject.id,
      filePath,
      fileExtension,
      mt,
      src,
      tgt,
    });
  }

  return { projectIds: createdProjectIds };
}

