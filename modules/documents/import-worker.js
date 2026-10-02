import prisma from "@/lib/prisma";
import {
  startMtqeV2Worker,
  startProjectImportWorker,
} from "@/lib/queue";
import { DOCUMENT_STATUS } from "@/lib/document-status";
import {
  handleSdlxliffImportJob,
  handleUploadImportJob,
  resolveDocumentErrorStatus,
} from "./import-service";
import {
  MTQE_V2_JOB,
  PIPELINE_REVIEW_JOB,
  handleLlmReviewJob,
  handleScoreMtqeV2Job,
  recordMtqeV2Failure,
  recordReviewFailure,
} from "./pipeline-service";

// Statuses shown to the user when an import job exhausts its retries.
function errorStatusFor(job, error) {
  if (job.name === "import-sdlxliff") return DOCUMENT_STATUS.FILE_ERROR;
  return resolveDocumentErrorStatus(error);
}

/**
 * Starts the BullMQ worker that runs the import pipeline (pdocs extraction,
 * DAAIT translation, QE v2 scoring). Called once per server process from
 * instrumentation.js.
 */
export function startImportWorker() {
  // QE v2 on its own queue/worker: progresses and retries without competing
  // with the import pipeline (concurrency 1 — the MTQE service dislikes
  // parallel scoring).
  startMtqeV2Worker({
    handlers: { [MTQE_V2_JOB]: handleScoreMtqeV2Job },
    onFinalFailure: async (job, error) => {
      const documentId = job.data?.projectId;
      console.error(
        `[mtqe-v2-worker] Job for document ${documentId} failed permanently:`,
        error?.message ?? error,
      );
      if (documentId) await recordMtqeV2Failure(documentId, error);
    },
  });

  return startProjectImportWorker({
    handlers: {
      "import-upload": handleUploadImportJob,
      "import-sdlxliff": handleSdlxliffImportJob,
      [PIPELINE_REVIEW_JOB]: handleLlmReviewJob,
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

      // Pipeline stages degrade instead of erroring the document: an LLM
      // failure only lands in pipelineStats — the document is already READY.
      if (job.name === PIPELINE_REVIEW_JOB) {
        await recordReviewFailure(documentId, error);
        return;
      }

      await prisma.document
        .update({
          where: { id: documentId },
          data: { status: errorStatusFor(job, error) },
        })
        .catch(() => {});
    },
  });
}
