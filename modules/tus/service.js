import { HttpError } from "../shared/http-error";
import {
  findProjectForTus,
  findTuById,
  findTusByProjectId,
  findTusWithSameSource,
  updateTuById,
} from "./repository";

function clearText(txt) {
  return txt
    .trim()
    .replace(/<[^>]*>|\n/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(". ", ".");
}

export async function listTusByProjectService(projectId, actorUser) {
  if (!projectId) {
    throw new HttpError(400, "projectId is required");
  }

  const project = await findProjectForTus(projectId, actorUser);
  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  const tus = await findTusByProjectId(projectId);
  return {
    total: tus.length,
    docs: tus,
  };
}

export async function updateTuStatusService(payload) {
  const { tuId, reviewLiteral, action, levenshteinDistance = null } = payload;

  const tu = await findTuById(tuId);
  if (!tu) {
    throw new HttpError(404, "Tu not found");
  }

  const tusWithSameSrcLiteral = await findTusWithSameSource(
    tu.projectId,
    tu.srcLiteral,
    tuId
  );

  const data = {};
  if (action === "approve") {
    const translatedClear = clearText(tu.translatedLiteral || "");
    const reviewClear = clearText(reviewLiteral || "");
    data.Status =
      translatedClear === reviewClear || !reviewClear ? "ACCEPTED" : "EDITED";
    data.reviewLiteral = reviewLiteral;
  } else if (action === "reject") {
    data.Status = "REJECTED";
  }

  if (levenshteinDistance) {
    data.levenshteinDistance = levenshteinDistance;
  }

  const tuUpdated = await updateTuById(tuId, data);

  if (tusWithSameSrcLiteral.length > 0) {
    await Promise.all(tusWithSameSrcLiteral.map((item) => updateTuById(item.id, data)));
  }

  return tuUpdated;
}

