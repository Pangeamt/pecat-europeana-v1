import type { AxiosResponse } from "axios";
import { httpClient } from "./http-client";
import type {
  CreateTuPayload,
  DeleteTuPayload,
  ProjectTu,
  SearchTuQuery,
  TuListResponse,
  UpdateProjectTuPayload,
  UpdateTuPayload,
} from "@/types/tm";

export const confirmTu = async (
  payload: UpdateProjectTuPayload,
): Promise<AxiosResponse<{ tu: ProjectTu; alsoUpdated: ProjectTu[] }>> => {
  return await httpClient({
    method: "post",
    url: "/api/tus",
    data: payload,
  });
};

export const confirmTuTm = async (
  payload: CreateTuPayload,
): Promise<AxiosResponse<unknown>> => {
  return await httpClient({
    method: "post",
    url: "/api/tu",
    data: payload,
  });
};

export const updateTuTm = async (
  payload: UpdateTuPayload,
): Promise<AxiosResponse<unknown>> => {
  return await httpClient({
    method: "patch",
    url: "/api/tu",
    data: payload,
  });
};

export const deleteTuTm = async (
  payload: DeleteTuPayload,
): Promise<AxiosResponse<unknown>> => {
  return await httpClient({
    method: "delete",
    url: "/api/tu",
    data: payload,
  });
};

export const getTus = async (
  projectId: string,
): Promise<AxiosResponse<{ total: number; docs: ProjectTu[] }>> => {
  return await httpClient({
    method: "get",
    url: "/api/tus",
    params: { projectId },
  });
};

export const getTmTus = async (
  params: SearchTuQuery,
): Promise<AxiosResponse<TuListResponse>> => {
  return await httpClient.get<TuListResponse>("/api/tu", { params });
};
