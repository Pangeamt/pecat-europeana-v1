import { httpClient } from "./http-client";
import axios from "axios";
import type {
  CreateTmPayload,
  ListTmQuery,
  ProjectLogsStats,
  TmListResponse,
  TranslationMemory,
  TuListResponse,
  UpdateTmPayload,
} from "@/types/tm";

type ApiErrorResponse = {
  code?: string;
  message?: string;
  error?: string;
};

async function readBlobError(data: unknown): Promise<ApiErrorResponse | null> {
  if (!(data instanceof Blob)) return null;

  const text = await data.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as ApiErrorResponse;
  } catch {
    return { message: text };
  }
}

async function getRequestErrorMessage(
  error: unknown,
  fallback: string,
): Promise<string> {
  if (!axios.isAxiosError(error)) return fallback;

  const blobError = await readBlobError(error.response?.data);
  return (
    blobError?.message ||
    blobError?.error ||
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    fallback
  );
}

export const addTMRequest = async (
  tm: CreateTmPayload,
): Promise<TranslationMemory> => {
  const response = await httpClient.post<TranslationMemory>("/api/tm", tm);
  return response.data;
};

export const fetchTMRequest = async (
  query?: ListTmQuery,
): Promise<TmListResponse> => {
  const response = await httpClient.get<TmListResponse>("/api/tm", {
    params: query,
  });
  return response.data;
};

export const fetchTMByIdRequest = async (
  tmId: string,
): Promise<TranslationMemory> => {
  const response = await httpClient.get<TranslationMemory>(`/api/tm/${tmId}`);
  return response.data;
};

export const fetchTMTusRequest = async (
  tmId: string,
  pagination?: { page?: number; size?: number },
): Promise<TuListResponse> => {
  const response = await httpClient.get<TuListResponse>("/api/tu/all", {
    params: {
      translation_memory_id: tmId,
      page: pagination?.page,
      size: pagination?.size,
    },
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
  try {
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
  } catch (error) {
    throw new Error(
      await getRequestErrorMessage(error, "Error exporting TM"),
    );
  }
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
