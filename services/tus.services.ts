import { httpClient } from "./http-client";

export const confirmTu = async (payload) => {
  return await httpClient({
    method: "post",
    url: "/api/tus",
    data: payload,
  });
};

export const confirmTuTm = async (payload) => {
  return await httpClient({
    method: "post",
    url: "/api/tu",
    data: payload,
  });
};

export const updateTuTm = async (payload) => {
  return await httpClient({
    method: "patch",
    url: "/api/tu",
    data: payload,
  });
};

export const getTus = async (projectId) => {
  return await httpClient({
    method: "get",
    url: "/api/tus",
    params: { projectId },
  });
};

export const getTmTus = async (params) => {
  return await httpClient.get("/api/tu", { params });
};

