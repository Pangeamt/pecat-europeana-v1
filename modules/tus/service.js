import { HttpError } from "../shared/http-error";
import {
  findProjectForTus,
  findTuById,
  findTusByProjectId,
  findTusWithSameSource,
  updateTuById,
} from "./repository";

async function assertTuAccessibleByActor(tu, actorUser) {
  if (!tu.projectId) {
    throw new HttpError(403, "Translation unit is not attached to a project");
  }

  const project = await findProjectForTus(tu.projectId, actorUser);
  if (!project) {
    throw new HttpError(404, "Project not found");
  }
  return project;
}

function clearText(txt) {
  return txt
    .normalize("NFKC")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s([.,;:!?])/g, "$1")
    .trim();
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

export async function updateTuStatusService(payload, actorUser) {
  const { tuId, reviewLiteral, action, levenshteinDistance = null } = payload;

  const tu = await findTuById(tuId);
  if (!tu) {
    throw new HttpError(404, "Tu not found");
  }

  await assertTuAccessibleByActor(tu, actorUser);

  const tusWithSameSrcLiteral = await findTusWithSameSource(
    tu.projectId,
    tu.srcLiteral,
    tuId,
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

  let alsoUpdated = [];
  if (tusWithSameSrcLiteral.length > 0) {
    alsoUpdated = await Promise.all(
      tusWithSameSrcLiteral.map((item) => updateTuById(item.id, data)),
    );
  }

  return { tu: tuUpdated, alsoUpdated };
}
