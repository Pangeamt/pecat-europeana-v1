import { httpClient } from "./http-client";

const TM_HOST = process.env.NEXT_PUBLIC_TM_HOST;

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
    url: `${TM_HOST}/tu`,
    data: payload,
  });
};

export const updateTuTm = async (payload) => {
  return await httpClient({
    method: "patch",
    url: `${TM_HOST}/tu`,
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
  return await httpClient.get(`${TM_HOST}/tu`, { params });
};

