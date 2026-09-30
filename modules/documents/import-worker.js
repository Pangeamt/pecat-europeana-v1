import prisma from "@/lib/prisma";
import {
  startMtqeV1Worker,
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
  PIPELINE_SCORE_JOB,
  handleLegacyScoreJob,
  handleLlmReviewJob,
  handleScoreMtqeV2Job,
  recordMtqeV2Failure,
  recordReviewFailure,
  releaseDocumentAndScore,
} from "./pipeline-service";

// Statuses shown to the user when an import job exhausts its retries.
function errorStatusFor(job, error) {
  if (job.name === "import-sdlxliff") return DOCUMENT_STATUS.FILE_ERROR;
  return resolveDocumentErrorStatus(error);
}

// Last resort for a legacy pipeline-score job that exhausted its retries: the
// document must still become usable. TODO: delete with the mtqe-v1 queue.
async function releaseAfterLegacyScoreFailure(documentId) {
  await releaseDocumentAndScore(documentId).catch(() =>
    prisma.document
      .update({ where: { id: documentId }, data: { status: DOCUMENT_STATUS.READY } })
      .catch(() => {}),
  );
}

/**
 * Starts the BullMQ worker that runs the import pipeline (pdocs extraction,
 * DAAIT translation, QE v2 scoring). Called once per server process from
 * instrumentation.js.
 */
export function startImportWorker() {
  // QE v1 is retired: this worker only drains pipeline-score jobs left in the
  // mtqe-v1 queue by the previous release (they just release the document).
  // TODO: remove together with the mtqe-v1 queue in the next release.
  startMtqeV1Worker({
    handlers: { [PIPELINE_SCORE_JOB]: handleLegacyScoreJob },
    onFinalFailure: async (job, error) => {
      const documentId = job.data?.projectId;
      console.error(
        `[mtqe-v1-worker] Legacy job for document ${documentId} failed permanently:`,
        error?.message ?? error,
      );
      if (documentId) await releaseAfterLegacyScoreFailure(documentId);
    },
  });

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
      [PIPELINE_SCORE_JOB]: handleLegacyScoreJob,
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

      // Pipeline stages degrade instead of erroring the document: a legacy
      // score job still releases the document and an LLM failure only lands
      // in pipelineStats — the document is already READY.
      if (job.name === PIPELINE_SCORE_JOB) {
        await releaseAfterLegacyScoreFailure(documentId);
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
