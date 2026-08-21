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
