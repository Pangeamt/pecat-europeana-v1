import { Queue, Worker } from "bullmq";
import { HttpError } from "@/modules/shared/http-error";

// BullMQ + Redis back the project import pipeline (extraction via pdocs, MT,
// MTQE): uploads respond immediately and a worker inside this same process
// (started from instrumentation.js) does the heavy lifting with persistence
// and retries — replacing the old fire-and-forget background promises.
export const PROJECT_IMPORT_QUEUE = "project-import";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export function buildConnection() {
  const url = new URL(REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    username: url.username || undefined,
    password: url.password || undefined,
    db: url.pathname ? Number(url.pathname.slice(1)) || 0 : 0,
    tls: url.protocol === "rediss:" ? {} : undefined,
    // Required for BullMQ workers; commands buffer while disconnected, so
    // producers guard their enqueues with an explicit timeout instead.
    maxRetriesPerRequest: null,
  };
}

// Singleton across dev HMR reloads (same pattern as lib/prisma.js).
function getQueue() {
  if (!global.projectImportQueue) {
    global.projectImportQueue = new Queue(PROJECT_IMPORT_QUEUE, {
      connection: buildConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: { age: 24 * 60 * 60, count: 500 },
        removeOnFail: { age: 7 * 24 * 60 * 60 },
      },
    });
  }
  return global.projectImportQueue;
}

/**
 * Adds a job to the import queue. With Redis down BullMQ buffers commands
 * indefinitely — fail fast (503) instead of leaving the upload hanging.
 */
export async function enqueueProjectImport(name, data) {
  const timeout = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error("enqueue timed out")),
      5_000,
    ).unref(),
  );
  try {
    return await Promise.race([getQueue().add(name, data), timeout]);
  } catch {
    throw new HttpError(
      503,
      "Job queue unavailable (is Redis running?). The project was not scheduled for processing.",
      "QUEUE_UNAVAILABLE",
    );
  }
}

/**
 * Starts the queue worker in this process. `handlers` maps job names to async
 * functions; `onFinalFailure(job, error)` fires only when no retries remain.
 */
export function startProjectImportWorker({
  handlers,
  onFinalFailure,
  concurrency = 2,
}) {
  if (global.projectImportWorker) return global.projectImportWorker;

  const worker = new Worker(
    PROJECT_IMPORT_QUEUE,
    async (job) => {
      const handler = handlers[job.name];
      if (!handler) {
        console.error(`[queue] No handler for job "${job.name}" (${job.id})`);
        return;
      }
      await handler(job.data);
    },
    { connection: buildConnection(), concurrency },
  );

  worker.on("failed", (job, error) => {
    if (!job) return;
    const attempts = job.opts.attempts ?? 1;
    const stalled = /stalled/i.test(error?.message ?? "");
    const unrecoverable = error?.name === "UnrecoverableError";
    if (job.attemptsMade < attempts && !stalled && !unrecoverable) {
      console.warn(
        `[queue] Job ${job.name} ${job.id} attempt ${job.attemptsMade}/${attempts} failed, will retry: ${error?.message}`,
      );
      return;
    }
    Promise.resolve(onFinalFailure?.(job, error)).catch((e) =>
      console.error(`[queue] onFinalFailure for ${job.id} failed:`, e),
    );
  });

  worker.on("error", (error) => {
    console.error("[queue] Worker error:", error?.message ?? error);
  });

  global.projectImportWorker = worker;
  return worker;
}
