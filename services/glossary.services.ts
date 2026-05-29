import { httpClient } from "./http-client";
import axios from "axios";
import type {
  CreateGlossaryPayload,
  Glossary,
  GlossaryEntryListResponse,
  GlossaryListResponse,
  ListGlossaryQuery,
  UpdateGlossaryPayload,
} from "@/types/glossary";

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

export const addGlossaryRequest = async (
  glossary: CreateGlossaryPayload,
): Promise<Glossary> => {
  const response = await httpClient.post<Glossary>("/api/glossaries", glossary);
  return response.data;
};

export const fetchGlossariesRequest = async (
  query?: ListGlossaryQuery,
): Promise<GlossaryListResponse> => {
  const response = await httpClient.get<GlossaryListResponse>("/api/glossaries", {
    params: query,
  });
  return response.data;
};

export const fetchGlossaryByIdRequest = async (
  glossaryId: string,
): Promise<Glossary> => {
  const response = await httpClient.get<Glossary>(
    `/api/glossaries/${glossaryId}`,
  );
  return response.data;
};

export const fetchGlossaryEntriesRequest = async (
  glossaryId: string,
  pagination?: { page?: number; size?: number; filter?: string },
): Promise<GlossaryEntryListResponse> => {
  const response = await httpClient.get<GlossaryEntryListResponse>(
    `/api/glossaries/${glossaryId}/entries`,
    {
      params: {
        page: pagination?.page,
        size: pagination?.size,
        filter: pagination?.filter,
      },
    },
  );
  return response.data;
};

export const updateGlossaryRequest = async (
  glossary: UpdateGlossaryPayload,
): Promise<{ message: string }> => {
  const response = await httpClient.patch<{ message: string }>(
    "/api/glossaries",
    glossary,
  );
  return response.data;
};

export const deleteGlossaryRequest = async (
  glossaryId: string,
): Promise<{ message: string }> => {
  const response = await httpClient.delete<{ message: string }>(
    `/api/glossaries/${glossaryId}`,
  );
  return response.data;
};

export const exportGlossaryRequest = async (glossaryId: string): Promise<void> => {
  try {
    const response = await httpClient.get<Blob>("/api/glossaries/export", {
      params: { glossaryId },
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${glossaryId}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(
      await getRequestErrorMessage(error, "Error exporting glossary"),
    );
  }
};
