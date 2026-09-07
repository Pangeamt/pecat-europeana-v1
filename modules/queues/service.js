import { HttpError } from "../shared/http-error";
import {
  findDocumentsMeta,
  getQueueCounts,
  getQueueJob,
  getQueueJobs,
  listQueueNames,
  requireQueue,
} from "./repository";

// SUPER-only queue monitor: BullMQ state is operational infrastructure
// (payloads may reference any workspace), so no other role sees it.
function assertSuper(actorUser) {
  if (actorUser?.role !== "SUPER") {
    throw new HttpError(403, "Only SUPER users can access the job queues");
  }
}

function resolveQueue(name) {
  const queue = requireQueue(name);
  if (!queue) {
    throw new HttpError(404, `Unknown queue "${name}"`);
  }
  return queue;
}

const JOB_STATES = [
  "waiting",
  "active",
  "completed",
  "failed",
  "delayed",
  "paused",
];

async function stateOf(job) {
  try {
    return await job.getState();
  } catch {
    return null;
  }
}

function shapeJob(job, state) {
  return {
    id: job.id,
    name: job.name,
    // Payloads are tiny ({ projectId }) — safe to return whole.
    data: job.data ?? null,
    state,
    attemptsMade: job.attemptsMade ?? 0,
    attempts: job.opts?.attempts ?? 1,
    createdAt: job.timestamp ?? null,
    processedOn: job.processedOn ?? null,
    finishedOn: job.finishedOn ?? null,
    failedReason: job.failedReason ?? null,
  };
}

export async function getQueuesOverviewService(actorUser) {
  assertSuper(actorUser);
  const queues = await Promise.all(
    listQueueNames().map(async (name) => ({
      name,
      counts: await getQueueCounts(resolveQueue(name)),
    })),
  );
  return { queues };
}

export async function listQueueJobsService(
  { name, state, page = 1, pageSize = 20 },
  actorUser,
) {
  assertSuper(actorUser);
  if (!JOB_STATES.includes(state)) {
    throw new HttpError(400, `state must be one of ${JOB_STATES.join(", ")}`);
  }
  const queue = resolveQueue(name);
  const start = (page - 1) * pageSize;
  const jobs = await getQueueJobs(queue, state, start, start + pageSize - 1);
  const counts = await getQueueCounts(queue);
  const shaped = jobs.filter(Boolean).map((job) => shapeJob(job, state));

  // Resolve names for the page's documents so the UI shows workspace /
  // project / document instead of raw ids (payloads carry documentId only).
  const documentIds = [
    ...new Set(shaped.map((job) => job.data?.projectId).filter(Boolean)),
  ];
  const metaById = new Map(
    (await findDocumentsMeta(documentIds)).map((doc) => [doc.id, doc]),
  );
  for (const job of shaped) {
    const meta = metaById.get(job.data?.projectId);
    job.documentName = meta ? (meta.label ?? meta.filename) : null;
    job.projectName = meta?.project?.name ?? null;
    job.workspaceName = meta?.workspace?.name ?? null;
  }

  return {
    total: counts[state] ?? 0,
    counts,
    jobs: shaped,
  };
}

export async function actOnQueueJobService({ name, jobId, action }, actorUser) {
  assertSuper(actorUser);
  const queue = resolveQueue(name);
  const job = await getQueueJob(queue, jobId);
  if (!job) {
    throw new HttpError(404, "Job not found");
  }

  if (action === "retry") {
    const state = await stateOf(job);
    if (state !== "failed") {
      throw new HttpError(409, "Only failed jobs can be retried");
    }
    await job.retry();
    return { ok: true };
  }

  // action === "remove" (schema-validated): never yank an actively running
  // job out from under its worker.
  const state = await stateOf(job);
  if (state === "active") {
    throw new HttpError(409, "The job is running; wait for it to finish");
  }
  await job.remove();
  return { ok: true };
}
