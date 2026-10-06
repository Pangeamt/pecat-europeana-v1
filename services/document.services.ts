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

// Link of the PROCESSED file. The server refuses it (409 DOCUMENT_INCOMPLETE,
// with the counts in `data`) while segments are pending; `partial` asks for an
// admin's partial delivery.
export const getDocumentShareLink = async (
  documentId: string,
  baseURL: string,
  { partial = false }: { partial?: boolean } = {},
) => {
  const { data } = await httpClient.get(
    `${baseURL}/api/file/${documentId}${partial ? "?partial=1" : ""}`,
  );
  return `${baseURL}/api/file?uuid=${data.uuid}&projectId=${documentId}`;
};

// Link of the file exactly as it was uploaded (session cookie, always allowed).
export const getDocumentOriginalLink = (documentId: string, baseURL: string) =>
  `${baseURL}/api/documents/${documentId}/original`;

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

// Submission locks: submit closes editing for a role, reopen (PM only)
// lifts it. The share variant closes the translator side with the token as
// the only authorization.
export const updateDocumentSubmission = async (
  documentId: string,
  role: "translator" | "reviewer",
  action: "submit" | "reopen",
) => {
  const response = await httpClient.post(
    `/api/documents/${documentId}/submission`,
    { role, action },
  );
  return response.data;
};

export const submitDocumentByShareToken = async (token: string) => {
  const response = await httpClient.post(`/api/share/tu/${token}/submit`);
  return response.data;
};
