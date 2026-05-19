import { HttpError } from "../shared/http-error";
import {
  buildProjectScopeWhere,
  findProjectById,
  findProjects,
  findProjectWithTmsForActor,
  getProjectStatusCounts,
  updateProjectById,
} from "./repository";

export async function getProjectByIdService(projectId, actorUser) {
  const project = await findProjectWithTmsForActor(projectId, actorUser);
  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  const tmIds = [];
  const tmNames = [];
  for (const link of project.projectTms) {
    tmIds.push(link.tmId);
    if (typeof link.tm?.name === "string") {
      tmNames.push(link.tm.name);
    }
  }

  return {
    ...project,
    tmIds,
    tmNames,
  };
}

export async function listProjectsService(actorUser) {
  const where = buildProjectScopeWhere(actorUser);
  const projects = await findProjects(where);

  const projectsWithStats = await Promise.all(
    projects.map(async (project) => {
      const { countByStatus, totalCount } = await getProjectStatusCounts(project.id);
      return { ...project, countByStatus, totalCount };
    })
  );

  return {
    total: projectsWithStats.length,
    docs: projectsWithStats,
  };
}

export async function updateProjectLabelService(projectId, label) {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new HttpError(404, "File not found");
  }

  await updateProjectById(projectId, { label });
}

export async function softDeleteProjectService(projectId) {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new HttpError(404, "File not found");
  }

  await updateProjectById(projectId, { deletedAt: new Date() });
}

