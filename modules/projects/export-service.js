import { HttpError } from '../shared/http-error';
import { findProjectForActor, findTusByProjectId } from './repository';
import { exportSdlxliffForDownload } from './sdlxliff-service';

export async function exportProjectAsSdlxliffService(projectId, actorUser) {
  if (!projectId) {
    throw new HttpError(400, 'projectId is required');
  }

  const project = await findProjectForActor(projectId, actorUser);
  if (!project) {
    throw new HttpError(404, 'Project not found');
  }

  if (project.extension !== 'sdlxliff') {
    throw new HttpError(
      400,
      `Project is not an SDLXLIFF project. Current format: ${project.extension}`
    );
  }

  if (project.status !== 'READY') {
    throw new HttpError(
      409,
      'Project is not ready yet. Wait until background processing finishes.'
    );
  }

  const tus = await findTusByProjectId(projectId);
  if (!tus || tus.length === 0) {
    throw new HttpError(404, 'No translation units found in project');
  }

  try {
    const sdlxliffContent = await exportSdlxliffForDownload(project.filePath, tus);
    return sdlxliffContent;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(500, `Failed to generate SDLXLIFF export: ${error.message}`);
  }
}

export async function exportProjectAsJsonService(projectId, actorUser) {
  if (!projectId) {
    throw new HttpError(400, 'projectId is required');
  }

  const project = await findProjectForActor(projectId, actorUser);
  if (!project) {
    throw new HttpError(404, 'Project not found');
  }

  if (project.status !== 'READY') {
    throw new HttpError(
      409,
      'Project is not ready yet. Wait until background processing finishes.'
    );
  }

  const tus = await findTusByProjectId(projectId);

  return {
    projectName: project.filename,
    sourceLanguage: project.sourceLanguage,
    targetLanguage: project.targetLanguage,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    status: project.status,
    totalUnits: tus.length,
    units: tus.map((tu) => ({
      id: tu.id,
      externalId: tu.externalId,
      source: tu.srcLiteral,
      target: tu.translatedLiteral,
      status: tu.Status,
      score: tu.translationScorePercent,
      review: tu.reviewLiteral,
      tmInfo: tu.tmInfo,
      glossaryInfo: tu.glossaryInfo,
    })),
  };
}
