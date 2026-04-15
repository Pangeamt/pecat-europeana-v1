import { httpClient } from "./http-client";

const TM_HOST = process.env.NEXT_PUBLIC_TM_HOST;

export const addTMRequest = async (tm) => {
  const response = await httpClient.post(`${TM_HOST}/tm`, tm);
  return response.data;
};

export const fetchTMRequest = async (user) => {
  const response = await httpClient.get(`${TM_HOST}/tm`, { params: { user } });
  return response.data;
};

export const updateTMRequest = async (tm) => {
  const response = await httpClient.patch(`${TM_HOST}/tm`, tm);
  return response.data;
};

export const deleteTMRequest = async (tmId) => {
  const response = await httpClient.delete(`${TM_HOST}/tm/${tmId}`);
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

