// Which execution of a document's import is the one that counts, kept in this
// process (pure, no project imports: node:test loads it).
//
// A queue job can be executed more than once at the same time: when its lock
// in Redis is lost while the job is still alive (a long wait for DAAIT, a
// stall of the host), BullMQ takes it for dead and starts it again. Two
// executions then translated the same document side by side, and both saved
// (twice the segments), or the job was given up as "stalled" and the document
// flagged as failed while one of them was about to finish.
//
// The rule here: the LAST execution to start owns the document. An older one
// notices at its next step and stops without writing anything.

import { randomUUID } from "node:crypto";

const state = (globalThis.__pecatImportRuns ??= {
  current: new Map(), // documentId -> token of the execution that owns it
  orphaned: new Set(), // documents whose job the queue gave up while one ran
});

/** Thrown inside an execution that is no longer the one that counts. */
export class ImportSupersededError extends Error {
  constructor(documentId) {
    super(`import of ${documentId} superseded by a newer execution`);
    this.name = "ImportSupersededError";
  }
}

/** Starts an execution: from now on it is the one that owns the document. */
export function beginImportRun(documentId) {
  const run = randomUUID();
  state.current.set(documentId, run);
  state.orphaned.delete(documentId);
  return run;
}

/** Whether `run` still owns the document (no newer execution started). */
export function isCurrentImportRun(documentId, run) {
  return state.current.get(documentId) === run;
}

/** Ends an execution; only the owner clears the document's entry. */
export function endImportRun(documentId, run) {
  if (state.current.get(documentId) !== run) return;
  state.current.delete(documentId);
  state.orphaned.delete(documentId);
}

/** Whether some execution of this document's import is alive in this process. */
export function isImportRunning(documentId) {
  return state.current.has(documentId);
}

/**
 * Resolves once no execution of this document's import is alive here.
 *
 * An execution that has been superseded must wait for this before it returns
 * to the queue: BullMQ tracks the renewal of a job's lock by job id, so the
 * moment the OLD execution of a job returns, the worker stops renewing the
 * lock of the NEW one -- which is then taken for dead and relaunched in turn.
 */
export async function waitForImportToEnd(documentId, { pollMs = 2_000, maxMs = 3 * 60 * 60_000 } = {}) {
  const deadline = Date.now() + maxMs;
  while (state.current.has(documentId) && Date.now() < deadline) {
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, pollMs);
      timer.unref?.();
    });
  }
}

/**
 * The queue gave the job up (stalled) -- but if an execution is still alive
 * here, the document is NOT failed yet: that execution decides. Returns true
 * when that is the case (and remembers it, see takeOrphanedImport).
 */
export function markImportOrphaned(documentId) {
  if (!state.current.has(documentId)) return false;
  state.orphaned.add(documentId);
  return true;
}

/**
 * For the execution that fails: true when the queue had already given its
 * job up, so nobody else will record the failure and it must do it itself.
 */
export function takeOrphanedImport(documentId) {
  return state.orphaned.delete(documentId);
}
