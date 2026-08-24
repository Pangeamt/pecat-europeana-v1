// DAAIT build status for TMs and glossaries (GET /memory/{id} and
// /glossary/{id} return it as `status`). Stored locally as a plain string —
// same approach as Document.status — so a new DAAIT state needs no migration.
export const MEMORY_ASSET_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  REBUILDING: "REBUILDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
};

export const MEMORY_ASSET_STATUSES = Object.values(MEMORY_ASSET_STATUS);

// Only a SUCCESS asset can be attached to a profile or a document.
export const MEMORY_ASSET_READY_STATUS = MEMORY_ASSET_STATUS.SUCCESS;

// Final states: the status worker stops polling DAAIT once one is reached.
export const MEMORY_ASSET_FINAL_STATUSES = [
  MEMORY_ASSET_STATUS.SUCCESS,
  MEMORY_ASSET_STATUS.FAILED,
];

export function isFinalMemoryAssetStatus(status) {
  return MEMORY_ASSET_FINAL_STATUSES.includes(status);
}
