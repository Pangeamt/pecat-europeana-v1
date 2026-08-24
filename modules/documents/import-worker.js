import prisma from "@/lib/prisma";
import { startProjectImportWorker } from "@/lib/queue";
import { DOCUMENT_STATUS } from "@/lib/document-status";
import {
  handleSdlxliffImportJob,
  handleUploadImportJob,
  resolveDocumentErrorStatus,
} from "./import-service";
import {
  PIPELINE_REVIEW_JOB,
  PIPELINE_SCORE_JOB,
  handleLlmReviewJob,
  handleScoreMtqeJob,
  recordReviewFailure,
  releaseDocumentAfterScoreFailure,
} from "./pipeline-service";

// Statuses shown to the user when an import job exhausts its retries.
function errorStatusFor(job, error) {
  if (job.name === "import-sdlxliff") return DOCUMENT_STATUS.FILE_ERROR;
  return resolveDocumentErrorStatus(error);
}

/**
 * Starts the BullMQ worker that runs the import pipeline (pdocs extraction,
 * DAAIT translation, MTQE scoring, LLM review). Called once per server
 * process from instrumentation.js.
 */
export function startImportWorker() {
  return startProjectImportWorker({
    handlers: {
      "import-upload": handleUploadImportJob,
      "import-sdlxliff": handleSdlxliffImportJob,
      [PIPELINE_SCORE_JOB]: handleScoreMtqeJob,
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

      // Pipeline stages degrade instead of erroring the document: an MTQE
      // outage still releases the document (unscored = low band) and an LLM
      // failure only lands in pipelineStats — the document is already READY.
      if (job.name === PIPELINE_SCORE_JOB) {
        await releaseDocumentAfterScoreFailure(documentId, error);
        return;
      }
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
