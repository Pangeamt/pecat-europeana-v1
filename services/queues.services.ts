import { httpClient } from "./http-client";

// SUPER-only queue monitor (/dashboard/queues).

export const getQueuesOverview = async () => {
  const response = await httpClient.get("/api/admin/queues");
  return response.data as {
    queues: { name: string; counts: Record<string, number> }[];
  };
};

export interface QueueJob {
  id: string;
  name: string;
  data: Record<string, unknown> | null;
  state: string;
  attemptsMade: number;
  attempts: number;
  createdAt: number | null;
  processedOn: number | null;
  finishedOn: number | null;
  failedReason: string | null;
  documentName: string | null;
  projectName: string | null;
  workspaceName: string | null;
}

export const listQueueJobs = async (
  name: string,
  state: string,
  page: number,
  pageSize: number,
) => {
  const response = await httpClient.get(
    `/api/admin/queues/${encodeURIComponent(name)}`,
    { params: { state, page, pageSize } },
  );
  return response.data as {
    total: number;
    counts: Record<string, number>;
    jobs: QueueJob[];
  };
};

export const actOnQueueJob = async (
  name: string,
  jobId: string,
  action: "retry" | "remove",
) => {
  const response = await httpClient.post(
    `/api/admin/queues/${encodeURIComponent(name)}`,
    { jobId, action },
  );
  return response.data;
};
