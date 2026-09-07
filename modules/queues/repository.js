import {
  MONITORED_QUEUE_NAMES,
  getQueueByName,
} from "@/lib/queue";

// Thin adapter over the BullMQ queues (lib/queue.js) so the service never
// touches the infra client directly, per the module layering rules.

export function listQueueNames() {
  return MONITORED_QUEUE_NAMES;
}

export function requireQueue(name) {
  return getQueueByName(name);
}

export async function getQueueCounts(queue) {
  return queue.getJobCounts(
    "waiting",
    "active",
    "completed",
    "failed",
    "delayed",
    "paused",
  );
}

export async function getQueueJobs(queue, state, start, end) {
  // BullMQ lists newest first for finished sets when asc=false.
  return queue.getJobs([state], start, end, false);
}

export async function getQueueJob(queue, jobId) {
  return queue.getJob(jobId);
}
