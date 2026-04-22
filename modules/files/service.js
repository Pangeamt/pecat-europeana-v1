import fs from "fs";
import path from "path";
import { createGzip } from "zlib";
import { pipeline } from "stream";
import { promisify } from "util";
import { uid } from "uid";
import { oxygenBuildFile } from "../../lib/utils";
import { HttpError } from "../shared/http-error";
import { findProjectForActor } from "../projects/repository";
import { findProjectById, findTusByProjectId, updateProjectById } from "./repository";

const pipelineAsync = promisify(pipeline);
const unlinkAsync = promisify(fs.unlink);

function combineAndRemoveTusSegments(array) {
  const combined = {};

  array.forEach((obj) => {
    if (!obj.belongTo) return;

    if (combined[obj.belongTo]) {
      combined[obj.belongTo].srcLiteral += ` ${obj.srcLiteral}`;
      combined[obj.belongTo].translatedLiteral += ` ${obj.translatedLiteral}`;
      return;
    }

    combined[obj.belongTo] = {
      ...obj,
      id: obj.belongTo,
      translationScorePercent: null,
    };
  });

  const filtered = array.filter((obj) => !obj.belongTo);
  Object.keys(combined).forEach((key) => {
    delete combined[key].belongTo;
    filtered.push(combined[key]);
  });

  return filtered;
}

export async function generateProjectShareUuidService(projectId, actorUser) {
  const project = await findProjectForActor(projectId, actorUser);
  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  const uuid = uid();
  await updateProjectById(projectId, {
    uuid,
    accessDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return uuid;
}

export async function buildProjectDownloadService({ uuid, projectId }) {
  if (!uuid || !projectId) {
    throw new HttpError(400, "uuid or projectId is required");
  }

  const project = await findProjectById(projectId);
  if (!project || project.uuid !== uuid) {
    throw new HttpError(404, "Project not found");
  }

  const accessDeadline = new Date(project.accessDeadline);
  if (accessDeadline < new Date()) {
    throw new HttpError(401, "The link has expired");
  }

  const tus = await findTusByProjectId(project.id);
  const tusCombined = combineAndRemoveTusSegments(tus);

  if (project.extension === "json") {
    const jsonString = JSON.stringify(tusCombined);
    const fileNameAux = project.filename.split(".json")[0];
    const aux = Date.now();
    const downloadsDir = path.resolve("./public/files/downloads");
    const jsonFilePath = path.resolve(
      `./public/files/downloads/${fileNameAux}-${aux}-pecat.json`
    );
    const gzFilePath = path.resolve(
      `./public/files/downloads/${fileNameAux}-${aux}-pecat.json.gz`
    );

    await fs.promises.mkdir(downloadsDir, { recursive: true });
    await fs.promises.writeFile(jsonFilePath, jsonString);

    await pipelineAsync(
      fs.createReadStream(jsonFilePath),
      createGzip(),
      fs.createWriteStream(gzFilePath)
    );

    const fileBuffer = await fs.promises.readFile(gzFilePath);
    setTimeout(async () => {
      try {
        await unlinkAsync(jsonFilePath);
        await unlinkAsync(gzFilePath);
      } catch {
        // no-op
      }
    }, 5000);

    return {
      body: fileBuffer,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename=${fileNameAux}-pecat.json.gz`,
      },
    };
  }

  const tgts = tusCombined.map((tu) =>
    tu.reviewLiteral ? tu.reviewLiteral : tu.translatedLiteral || ""
  );
  const data = await oxygenBuildFile({
    tgts,
    src_lang: project.sourceLanguage,
    tgt_lang: project.targetLanguage,
    filePath: project.filePath,
  });

  return {
    body: Buffer.from(data),
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename=${project.filename}`,
    },
  };
}

