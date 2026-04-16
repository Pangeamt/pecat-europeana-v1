import { httpClient } from "./http-client";

export const addTMRequest = async (tm) => {
  const response = await httpClient.post("/api/tm", tm);
  return response.data;
};

export const fetchTMRequest = async (user) => {
  const response = await httpClient.get("/api/tm", { params: { user } });
  return response.data;
};

export const updateTMRequest = async (tm) => {
  const response = await httpClient.patch("/api/tm", tm);
  return response.data;
};

export const deleteTMRequest = async (tmId) => {
  const response = await httpClient.delete(`/api/tm/${tmId}`);
  return response.data;
};

export const exportTMRequest = async (tmId) => {
  const response = await httpClient.get("/api/tm/export", {
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

export const getLogsRequest = async (projectId, tmId) => {
  const response = await httpClient.get("/api/projects/logs", {
    params: { projectId, tmId },
  });
  return response.data;
};

