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
import type { tuAppendPayload } from "@/types/tu.type";

export const confirmTu = async (
  payload: UpdateProjectTuPayload,
): Promise<AxiosResponse<{ tu: ProjectTu; alsoUpdated: ProjectTu[] }>> => {
  return await httpClient({
    method: "patch",
    url: "/api/tus",
    data: payload,
  });
};

export interface TuDraftEvaluation {
  score: number | null;
  verdict: "OK" | "REVIEW" | null;
  suggestion: string | null;
  meta: Record<string, unknown> | null;
  daaitStatus?: string | null;
}

export const evaluateTu = async (payload: {
  tuId: string;
  target: string;
}): Promise<AxiosResponse<TuDraftEvaluation>> => {
  return await httpClient({
    method: "post",
    url: "/api/tus/evaluate",
    data: payload,
  });
};

export const evaluateTuByShareToken = async (
  token: string,
  payload: { tuId: string; target: string },
): Promise<AxiosResponse<TuDraftEvaluation>> => {
  return await httpClient({
    method: "post",
    url: `/api/share/tu/${token}/tus/evaluate`,
    data: payload,
  });
};

export const appendTu = async (
  payload: tuAppendPayload,
): Promise<AxiosResponse<unknown>> => {
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

// Public "share as translator" link — no login required, the token is the
// authorization.
export const getTusByShareToken = async (
  token: string,
): Promise<AxiosResponse<{ total: number; docs: ProjectTu[] }>> => {
  return await httpClient({
    method: "get",
    url: `/api/share/tu/${token}/tus`,
  });
};

export const confirmTuByShareToken = async (
  token: string,
  payload: UpdateProjectTuPayload,
): Promise<AxiosResponse<{ tu: ProjectTu; alsoUpdated: ProjectTu[] }>> => {
  return await httpClient({
    method: "patch",
    url: `/api/share/tu/${token}/tus`,
    data: payload,
  });
};

export const appendTuByShareToken = async (
  token: string,
  payload: tuAppendPayload,
): Promise<AxiosResponse<unknown>> => {
  return await httpClient({
    method: "post",
    url: `/api/share/tu/${token}/tus`,
    data: payload,
  });
};

export const getTmTus = async (
  params: SearchTuQuery,
): Promise<AxiosResponse<TuListResponse>> => {
  return await httpClient.get<TuListResponse>("/api/tu", { params });
};
