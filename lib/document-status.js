// Single source of truth for document lifecycle states. The DB column is a
// plain VARCHAR, so adding a state here (plus its i18n label under
// documents.status.* and a color below) requires no migration.
export const DOCUMENT_STATUS = {
  UPLOADED: "UPLOADED",
  PROCESSING: "PROCESSING",
  FILE_PROCESSING: "FILE_PROCESSING",
  // Legacy values kept for old rows; the pipeline no longer writes them.
  MTQE_PROCESSING: "MTQE_PROCESSING",
  READY: "READY",
  FILE_ERROR: "FILE_ERROR",
  MTQE_ERROR: "MTQE_ERROR",
};

export const DOCUMENT_PENDING_STATUSES = [
  DOCUMENT_STATUS.UPLOADED,
  DOCUMENT_STATUS.PROCESSING,
  DOCUMENT_STATUS.FILE_PROCESSING,
  DOCUMENT_STATUS.MTQE_PROCESSING,
];

export const DOCUMENT_ERROR_STATUSES = [
  DOCUMENT_STATUS.FILE_ERROR,
  DOCUMENT_STATUS.MTQE_ERROR,
];

export const isDocumentReady = (status) => status === DOCUMENT_STATUS.READY;

export const isDocumentPending = (status) =>
  DOCUMENT_PENDING_STATUSES.includes(status);

export const isDocumentError = (status) =>
  DOCUMENT_ERROR_STATUSES.includes(status);

// antd Tag colors per status, used by the documents table.
export const DOCUMENT_STATUS_COLORS = {
  [DOCUMENT_STATUS.UPLOADED]: "default",
  [DOCUMENT_STATUS.PROCESSING]: "blue",
  [DOCUMENT_STATUS.FILE_PROCESSING]: "geekblue",
  [DOCUMENT_STATUS.MTQE_PROCESSING]: "cyan",
  [DOCUMENT_STATUS.READY]: "green",
  [DOCUMENT_STATUS.FILE_ERROR]: "red",
  [DOCUMENT_STATUS.MTQE_ERROR]: "volcano",
};
