import { HttpError } from "../shared/http-error";
import {
  createWorkspace,
  deleteWorkspace,
  findAllWorkspaces,
  findWorkspaceById,
  findWorkspaceByIdBasic,
  setUserWorkspace,
  updateWorkspace,
} from "./repository";

function assertSuper(actorUser) {
  if (actorUser.role !== "SUPER") {
    throw new HttpError(403, "Only SUPER users can perform this action");
  }
}

function canReadWorkspace(actorUser, workspaceId) {
  if (actorUser.role === "SUPER") return true;
  return actorUser.workspaceId === workspaceId;
}

function canManageWorkspace(actorUser, workspaceId) {
  if (actorUser.role === "SUPER") return true;
  return actorUser.role === "ADMIN" && actorUser.workspaceId === workspaceId;
}

export async function listWorkspacesService(actorUser) {
  if (actorUser.role === "SUPER") {
    return findAllWorkspaces();
  }

  if (!actorUser.workspaceId) return [];
  const workspace = await findWorkspaceById(actorUser.workspaceId);
  return workspace ? [workspace] : [];
}

export async function getWorkspaceByIdService(id, actorUser) {
  const workspace = await findWorkspaceById(id);
  if (!workspace) {
    throw new HttpError(404, "Workspace not found");
  }

  if (!canReadWorkspace(actorUser, id)) {
    throw new HttpError(403, "You cannot access this workspace");
  }

  return workspace;
}

export async function createWorkspaceService(payload, actorUser) {
  assertSuper(actorUser);
  return createWorkspace({ name: payload.name });
}

export async function updateWorkspaceService(id, payload, actorUser) {
  const existing = await findWorkspaceByIdBasic(id);
  if (!existing) {
    throw new HttpError(404, "Workspace not found");
  }

  if (!canManageWorkspace(actorUser, id)) {
    throw new HttpError(403, "You cannot update this workspace");
  }

  return updateWorkspace(id, { name: payload.name });
}

export async function deleteWorkspaceService(id, actorUser) {
  assertSuper(actorUser);
  const existing = await findWorkspaceByIdBasic(id);
  if (!existing) {
    throw new HttpError(404, "Workspace not found");
  }

  try {
    await deleteWorkspace(id);
  } catch (error) {
    if (error?.code === "P2003") {
      throw new HttpError(
        409,
        "Cannot delete a workspace with projects, TMs or members. Remove or reassign them first.",
      );
    }
    throw error;
  }
}

export async function addMemberToWorkspaceService(
  workspaceId,
  userId,
  actorUser,
) {
  const existing = await findWorkspaceByIdBasic(workspaceId);
  if (!existing) {
    throw new HttpError(404, "Workspace not found");
  }

  if (!canManageWorkspace(actorUser, workspaceId)) {
    throw new HttpError(403, "You cannot modify this workspace");
  }

  return setUserWorkspace(userId, workspaceId);
}

export async function removeMemberFromWorkspaceService(
  workspaceId,
  userId,
  actorUser,
) {
  const existing = await findWorkspaceByIdBasic(workspaceId);
  if (!existing) {
    throw new HttpError(404, "Workspace not found");
  }

  if (!canManageWorkspace(actorUser, workspaceId)) {
    throw new HttpError(403, "You cannot modify this workspace");
  }

  return setUserWorkspace(userId, null);
}
