import { startMemoryStatusQueue } from "@/lib/status-queue";
import { MEMORY_ASSET_STATUS } from "./status";
import { getTmDaait } from "./tm/repository";
import { getGlossaryDaait } from "./glossary/repository";
import {
  listPendingStatusTmRecords,
  updateTmStatusRecord,
} from "./tm/prisma-repository";
import {
  listPendingStatusGlossaryRecords,
  updateGlossaryStatusRecord,
} from "./glossary/prisma-repository";

const SWEEP_BATCH_SIZE = 50;
// Bound each DAAIT poll so a hung gateway cannot stall the sweep for minutes.
const DAAIT_POLL_TIMEOUT_MS = 10_000;

async function syncPendingRecords({ label, records, fetchDaait, updateStatus }) {
  for (const record of records) {
    try {
      const daaitDoc = await fetchDaait(record.id, {
        timeout: DAAIT_POLL_TIMEOUT_MS,
      });
      const status = daaitDoc?.status;
      if (status && status !== record.status) {
        await updateStatus(record.id, status);
        console.log(
          `[memory-status] ${label} ${record.id}: ${record.status} -> ${status}`,
        );
      }
    } catch (error) {
      if (error?.status === 404) {
        // DAAIT no longer knows the asset, so it can never become ready.
        await updateStatus(record.id, MEMORY_ASSET_STATUS.FAILED).catch(
          () => {},
        );
        console.warn(
          `[memory-status] ${label} ${record.id} not found in DAAIT, marked FAILED`,
        );
      } else {
        // Transient (timeout, 5xx, DAAIT down): the next sweep retries it.
        console.warn(
          `[memory-status] ${label} ${record.id} poll failed: ${error?.message}`,
        );
      }
    }
  }
}

/**
 * One sweep: polls DAAIT for every TM/glossary whose local status is not
 * SUCCESS/FAILED yet and persists the reported status.
 */
export async function syncPendingMemoryAssetStatuses() {
  const [tms, glossaries] = await Promise.all([
    listPendingStatusTmRecords(SWEEP_BATCH_SIZE),
    listPendingStatusGlossaryRecords(SWEEP_BATCH_SIZE),
  ]);

  if (tms.length === 0 && glossaries.length === 0) return;

  await Promise.all([
    syncPendingRecords({
      label: "TM",
      records: tms,
      fetchDaait: getTmDaait,
      updateStatus: updateTmStatusRecord,
    }),
    syncPendingRecords({
      label: "glossary",
      records: glossaries,
      fetchDaait: getGlossaryDaait,
      updateStatus: updateGlossaryStatusRecord,
    }),
  ]);
}

export function startMemoryStatusWorker() {
  return startMemoryStatusQueue({ handler: syncPendingMemoryAssetStatuses });
}
