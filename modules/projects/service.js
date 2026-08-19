import { HttpError } from "../shared/http-error";
// Direct file import (not the modules/documents barrel) to avoid closing the
// import cycle documents/import-service -> projects/repository.
import { listDocumentsByProjectService } from "../documents/service";
import { findProfileByIdBasic } from "../profiles/repository";
import {
  countDocumentsInProject,
  createProject,
  findProjectForActor,
  getProjectsWithStats,
  updateProjectById,
} from "./repository";

function optionalText(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text || text === "undefined" || text === "null") return null;
  return text;
}

function toProjectDoc(record) {
  if (!record) return null;
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    profileId: record.profileId,
    profileName: record.profile?.name ?? record.profileName ?? null,
    tmThreshold: record.tmThreshold,
    workspaceId: record.workspaceId,
    createdByUserId: record.createdByUserId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function assertProfileUsableInWorkspace(profileId, workspaceId) {
  const profile = await findProfileByIdBasic(profileId);
  if (!profile || profile.workspaceId !== workspaceId) {
    throw new HttpError(
      400,
      "The selected profile does not exist or is not in the workspace",
    );
  }
  return profile;
}

export async function listProjectsService(actorUser) {
  const rows = await getProjectsWithStats(actorUser);

  return {
    total: rows.length,
    docs: rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      profileId: row.profileId,
      profileName: row.profileName,
      tmThreshold: row.tmThreshold,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      docsCount: row.docsCount,
      segmentsCount: row.segmentsCount,
      finishedCount: row.finishedCount,
      progress:
        row.segmentsCount > 0
          ? Math.round((row.finishedCount * 100) / row.segmentsCount)
          : 0,
    })),
  };
}

export async function createProjectService(payload, actorUser) {
  if (!actorUser?.id) {
    throw new HttpError(401, "Unauthorized");
  }

  const workspaceId = actorUser.workspaceId;
  if (!workspaceId) {
    throw new HttpError(400, "A workspace is required to create a project");
  }

  await assertProfileUsableInWorkspace(payload.profileId, workspaceId);

  const record = await createProject({
    name: payload.name,
    description: optionalText(payload.description),
    profileId: payload.profileId,
    tmThreshold: payload.threshold ?? 0.75,
    createdByUserId: actorUser.id,
    workspaceId,
  });

  return toProjectDoc(record);
}

export async function getProjectDetailService(projectId, actorUser) {
  const record = await findProjectForActor(projectId, actorUser);
  if (!record) {
    throw new HttpError(404, "Project not found");
  }

  const documents = await listDocumentsByProjectService(projectId, actorUser);

  return {
    ...toProjectDoc(record),
    documents: documents.docs,
    documentsTotal: documents.total,
  };
}

export async function updateProjectService(projectId, payload, actorUser) {
  const existing = await findProjectForActor(projectId, actorUser);
  if (!existing) {
    throw new HttpError(404, "Project not found");
  }

  const data = {};
  if (payload.name !== undefined && payload.name !== null && payload.name !== "") {
    data.name = payload.name;
  }
  if (payload.description !== undefined) {
    data.description = optionalText(payload.description);
  }
  if (payload.profileId !== undefined && payload.profileId !== null) {
    await assertProfileUsableInWorkspace(payload.profileId, existing.workspaceId);
    data.profileId = payload.profileId;
  }
  if (payload.threshold !== undefined && payload.threshold !== null) {
    data.tmThreshold = payload.threshold;
  }

  if (Object.keys(data).length === 0) {
    throw new HttpError(400, "No fields to update");
  }

  const record = await updateProjectById(projectId, data);
  return toProjectDoc(record);
}

export async function softDeleteProjectService(projectId, actorUser) {
  const existing = await findProjectForActor(projectId, actorUser);
  if (!existing) {
    throw new HttpError(404, "Project not found");
  }

  const documents = await countDocumentsInProject(projectId);
  if (documents > 0) {
    throw new HttpError(
      409,
      "Cannot delete a project that still has documents. Remove them first.",
    );
  }

  await updateProjectById(projectId, { deletedAt: new Date() });
}
