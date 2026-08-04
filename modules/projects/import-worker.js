import prisma from "@/lib/prisma";
import { startProjectImportWorker } from "@/lib/queue";
import {
  handleSdlxliffImportJob,
  handleUploadImportJob,
  resolveProjectErrorStatus,
} from "./import-service";

// Statuses shown to the user when a job exhausts its retries.
function errorStatusFor(job, error) {
  if (job.name === "import-sdlxliff") return "FILE_ERROR";
  return resolveProjectErrorStatus(error);
}

/**
 * Starts the BullMQ worker that runs the import pipeline (pdocs extraction,
 * NexRelay MT, MTQE). Called once per server process from instrumentation.js.
 */
export function startImportWorker() {
  return startProjectImportWorker({
    handlers: {
      "import-upload": handleUploadImportJob,
      "import-sdlxliff": handleSdlxliffImportJob,
    },
    onFinalFailure: async (job, error) => {
      const projectId = job.data?.projectId;
      console.error(
        `[import-worker] Job ${job.name} for project ${projectId} failed permanently:`,
        error?.message ?? error,
      );
      if (!projectId) return;
      await prisma.project
        .update({
          where: { id: projectId },
          data: { status: errorStatusFor(job, error) },
        })
        .catch(() => {});
    },
  });
}
