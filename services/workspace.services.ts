import { httpClient } from "./http-client";

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    projects: number;
    tms: number;
  };
  members?: Array<{
    id: string;
    name: string;
    email: string;
    role: "SUPER" | "ADMIN" | "USER";
  }>;
}

export const listWorkspaces = async () => {
  const response = await httpClient.get<{ workspaces: Workspace[] }>(
    "/api/workspaces",
  );
  return response.data;
};

export const getWorkspace = async (id: string) => {
  const response = await httpClient.get<{ workspace: Workspace }>(
    `/api/workspaces/${id}`,
  );
  return response.data;
};

export const createWorkspace = async (payload: { name: string }) => {
  const response = await httpClient.post<{ workspace: Workspace }>(
    "/api/workspaces",
    payload,
  );
  return response.data;
};

export const updateWorkspace = async (
  id: string,
  payload: { name: string },
) => {
  const response = await httpClient.patch<{ workspace: Workspace }>(
    `/api/workspaces/${id}`,
    payload,
  );
  return response.data;
};

export const deleteWorkspace = async (id: string) => {
  const response = await httpClient.delete<{ status: string }>(
    `/api/workspaces/${id}`,
  );
  return response.data;
};

export const addWorkspaceMember = async (id: string, userId: string) => {
  const response = await httpClient.post<{
    member: { id: string; workspaceId: string };
  }>(`/api/workspaces/${id}/members`, { userId });
  return response.data;
};

export const removeWorkspaceMember = async (id: string, userId: string) => {
  const response = await httpClient.delete<{
    member: { id: string; workspaceId: null };
  }>(`/api/workspaces/${id}/members`, { data: { userId } });
  return response.data;
};

export const getMembersOfWorkspace = async (id: string) => {
  const response = await httpClient.get<{
    members: { id: string; workspaceId: string }[];
  }>(`/api/workspaces/${id}/members`);
  return response.data;
};
