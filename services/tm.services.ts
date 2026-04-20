import { httpClient } from "./http-client";
import type {
  CreateTmPayload,
  ProjectLogsStats,
  TmListResponse,
  TranslationMemory,
  UpdateTmPayload,
} from "@/types/tm";

export const addTMRequest = async (
  tm: CreateTmPayload,
): Promise<TranslationMemory> => {
  const response = await httpClient.post<TranslationMemory>("/api/tm", tm);
  return response.data;
};

export const fetchTMRequest = async (user: string): Promise<TmListResponse> => {
  const response = await httpClient.get<TmListResponse>("/api/tm", {
    params: { user },
  });
  return response.data;
};

export const updateTMRequest = async (
  tm: UpdateTmPayload,
): Promise<{ message: string }> => {
  const response = await httpClient.patch<{ message: string }>("/api/tm", tm);
  return response.data;
};

export const deleteTMRequest = async (
  tmId: string,
): Promise<{ message: string }> => {
  const response = await httpClient.delete<{ message: string }>(
    `/api/tm/${tmId}`,
  );
  return response.data;
};

export const exportTMRequest = async (tmId: string): Promise<void> => {
  const response = await httpClient.get<Blob>("/api/tm/export", {
    params: { tmId },
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "application/xml" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${tmId}.tmx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const getLogsRequest = async (
  projectId: string,
  tmId: string,
): Promise<ProjectLogsStats> => {
  const response = await httpClient.get<ProjectLogsStats>("/api/projects/logs", {
    params: { projectId, tmId },
  });
  return response.data;
};
