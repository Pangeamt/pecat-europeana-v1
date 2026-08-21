import { httpClient } from "./http-client";

export const listProjectDocuments = async (projectId: string) => {
  const response = await httpClient.get(`/api/projects/${projectId}`);
  return response.data;
};

export const uploadProjectDocuments = async (
  projectId: string,
  formData: FormData,
) => {
  const response = await httpClient.post(
    `/api/projects/${projectId}/documents`,
    formData,
  );
  return response.data;
};

export const getDocument = async (documentId: string) => {
  return await httpClient({
    method: "get",
    url: `/api/documents/${documentId}`,
  });
};

export const saveDocumentLabel = async (documentId: string, label: string) => {
  return await httpClient({
    method: "patch",
    url: `/api/documents/${documentId}`,
    data: { label },
  });
};

export const removeDocument = async (documentId: string) => {
  return await httpClient({
    method: "delete",
    url: `/api/documents/${documentId}`,
  });
};

export const updateDocumentTms = async (
  documentId: string,
  updateTmIds: string[],
) => {
  return await httpClient({
    method: "patch",
    url: `/api/documents/${documentId}/tms`,
    data: { updateTmIds },
  });
};

export const getDocumentShareLink = async (
  documentId: string,
  baseURL: string,
) => {
  const { data } = await httpClient.get(`${baseURL}/api/file/${documentId}`);
  return `${baseURL}/api/file?uuid=${data.uuid}&projectId=${documentId}`;
};

export type DocumentAssignmentRole = "translator" | "reviewer";

export const assignDocumentUser = async (
  documentId: string,
  role: DocumentAssignmentRole,
  userId: string | null,
) => {
  const response = await httpClient.patch(
    `/api/documents/${documentId}/assignments`,
    { role, userId },
  );
  return response.data;
};

// Public "share as translator" link — no login required, the token in the
// URL is the authorization. Used by the standalone /share/tu/[token] editor.
export const getDocumentConfigByShareToken = async (token: string) => {
  return await httpClient({
    method: "get",
    url: `/api/share/tu/${token}`,
  });
};

// Admin-only lifecycle of that link: get current state, (re)generate, revoke.
export const getTranslatorShareLink = async (documentId: string) => {
  const response = await httpClient.get(
    `/api/documents/${documentId}/translator-share`,
  );
  return response.data;
};

export const createTranslatorShareLink = async (documentId: string) => {
  const response = await httpClient.post(
    `/api/documents/${documentId}/translator-share`,
  );
  return response.data;
};

export const revokeTranslatorShareLink = async (documentId: string) => {
  const response = await httpClient.delete(
    `/api/documents/${documentId}/translator-share`,
  );
  return response.data;
};
