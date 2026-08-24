import { Queue, Worker } from "bullmq";
import { buildConnection } from "@/lib/queue";

// BullMQ queue that keeps the local Tm/Glossary `status` column in sync with
// DAAIT: a repeatable "sweep" job runs every 15s and polls every asset whose
// status is not final yet (see modules/memory/status-worker.js).
export const MEMORY_STATUS_QUEUE = "memory-status-sync";
export const MEMORY_STATUS_JOB = "sweep";
const MEMORY_STATUS_EVERY_MS = 15_000;

/**
 * Starts the repeatable sweep scheduler and its worker in this process.
 * Singleton across dev HMR reloads (same pattern as lib/queue.js).
 */
export function startMemoryStatusQueue({ handler }) {
  if (global.memoryStatusWorker) return global.memoryStatusWorker;

  const queue = new Queue(MEMORY_STATUS_QUEUE, {
    connection: buildConnection(),
    defaultJobOptions: {
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 50 },
    },
  });

  // upsert = idempotent across restarts: there is always exactly one
  // scheduler producing one sweep job every 15 seconds.
  queue
    .upsertJobScheduler(
      MEMORY_STATUS_JOB,
      { every: MEMORY_STATUS_EVERY_MS },
      { name: MEMORY_STATUS_JOB },
    )
    .catch((error) => {
      console.error(
        "[memory-status] Could not schedule the status sweep:",
        error?.message ?? error,
      );
    });

  // concurrency 1: sweeps are global, running two at once is useless and a
  // slow DAAIT would only serialize them anyway.
  const worker = new Worker(MEMORY_STATUS_QUEUE, () => handler(), {
    connection: buildConnection(),
    concurrency: 1,
  });

  worker.on("failed", (job, error) => {
    console.warn(
      `[memory-status] Sweep ${job?.id ?? "?"} failed: ${error?.message ?? error}`,
    );
  });

  worker.on("error", (error) => {
    console.error("[memory-status] Worker error:", error?.message ?? error);
  });

  global.memoryStatusQueue = queue;
  global.memoryStatusWorker = worker;
  return worker;
}
