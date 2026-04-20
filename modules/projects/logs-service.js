import { HttpError } from "@/modules/shared/http-error";
import { levenshteinSimilarity } from "@/modules/shared/similarity";
import { listAllTranslationUnitsService } from "@/modules/memory/tu";
import { findProjectForActor, findTusByProjectId } from "./repository";

export async function getProjectLogsStatsService({
  projectId,
  tmId,
  actorUser,
}) {
  const project = await findProjectForActor(projectId, actorUser);
  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  const tus = await findTusByProjectId(project.id);
  const tmTus = await listAllTranslationUnitsService(tmId);
  const docs = tmTus.docs;

  const stats = {
    noMatch: 0,
    "50To74": 0,
    "75To84": 0,
    "85To94": 0,
    "95To99": 0,
    100: 0,
  };

  for (let i = 0; i < tus.length; i++) {
    const tuElement = tus[i];
    let maxSimilarity = 0;
    for (let j = 0; j < docs.length; j++) {
      const tuTM = docs[j];
      const similarity = levenshteinSimilarity(
        tuElement.srcLiteral,
        tuTM.source_text,
      );
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
      }
    }

    const words = tuElement.srcLiteral.split(" ").length;
    if (maxSimilarity >= 0.5 && maxSimilarity < 0.75) {
      stats["50To74"] += words;
    } else if (maxSimilarity >= 0.75 && maxSimilarity < 0.85) {
      stats["75To84"] += words;
    } else if (maxSimilarity >= 0.85 && maxSimilarity < 0.94) {
      stats["85To94"] += words;
    } else if (maxSimilarity >= 0.95 && maxSimilarity < 1) {
      stats["95To99"] += words;
    } else if (maxSimilarity === 1) {
      stats["100"] += words;
    } else {
      stats.noMatch += words;
    }
  }

  return { projectId, tmId, stats };
}
