import prisma from "@/lib/prisma";
import { startProjectImportWorker } from "@/lib/queue";
import { DOCUMENT_STATUS } from "@/lib/document-status";
import {
  handleSdlxliffImportJob,
  handleUploadImportJob,
  resolveDocumentErrorStatus,
} from "./import-service";

// Statuses shown to the user when a job exhausts its retries.
function errorStatusFor(job, error) {
  if (job.name === "import-sdlxliff") return DOCUMENT_STATUS.FILE_ERROR;
  return resolveDocumentErrorStatus(error);
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
      // Payload key `projectId` carries the document row id (kept for
      // compatibility with jobs enqueued before the hierarchy refactor).
      const documentId = job.data?.projectId;
      console.error(
        `[import-worker] Job ${job.name} for document ${documentId} failed permanently:`,
        error?.message ?? error,
      );
      if (!documentId) return;
      await prisma.document
        .update({
          where: { id: documentId },
          data: { status: errorStatusFor(job, error) },
        })
        .catch(() => {});
    },
  });
}
