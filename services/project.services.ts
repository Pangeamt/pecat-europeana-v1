import { httpClient } from "./http-client";

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  profileId?: string | null;
  profileName?: string | null;
  tmThreshold: number;
  createdAt: string;
  updatedAt: string;
  docsCount: number;
  segmentsCount: number;
  finishedCount: number;
  progress: number;
}

export interface ProjectListResponse {
  total: number;
  docs: Project[];
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  profileId: string;
  threshold?: number;
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

export const listProjectsRequest = async (): Promise<ProjectListResponse> => {
  const response = await httpClient.get<ProjectListResponse>("/api/projects");
  return response.data;
};

export const fetchProjectByIdRequest = async (projectId: string) => {
  const response = await httpClient.get<{ project: Project & { documents: unknown[] } }>(
    `/api/projects/${projectId}`,
  );
  return response.data;
};

export const createProjectRequest = async (payload: CreateProjectPayload) => {
  const response = await httpClient.post<{ project: Project }>(
    "/api/projects",
    payload,
  );
  return response.data;
};

export const updateProjectRequest = async (
  projectId: string,
  payload: UpdateProjectPayload,
) => {
  const response = await httpClient.patch<{ project: Project }>(
    `/api/projects/${projectId}`,
    payload,
  );
  return response.data;
};

export const deleteProjectRequest = async (projectId: string) => {
  const response = await httpClient.delete<{ status: string }>(
    `/api/projects/${projectId}`,
  );
  return response.data;
};
