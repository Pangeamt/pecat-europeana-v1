// Undo / redo of the segment editor, as pure data (no imports: node:test
// loads it). Two levels, both kept in the browser for the session:
//
//   * TEXT: what the reviewer typed in a segment, one history per segment, so
//     leaving a segment and coming back still undoes.
//   * ACTIONS: what was saved (confirm, reject, lock, save draft...). Undoing
//     one asks the server to put every segment it touched back as it was
//     (PATCH /api/tus action "restore" with the snapshot).

export const MAX_HISTORY = 100;
// Keystrokes closer than this are one undo step (a burst of typing).
export const TYPING_GAP_MS = 600;

export const emptyTextHistory = () => ({ past: [], future: [], lastAt: 0 });

const capped = (list) =>
  list.length > MAX_HISTORY ? list.slice(list.length - MAX_HISTORY) : list;

/**
 * The text changed from `previous`: remember `previous` as an undo step,
 * unless it belongs to the same burst of typing. New typing drops the redo.
 */
export function recordText(history, previous, now, gap = TYPING_GAP_MS) {
  const base = history ?? emptyTextHistory();
  const sameBurst = base.past.length > 0 && now - base.lastAt < gap;
  return {
    past: sameBurst ? base.past : capped([...base.past, previous]),
    future: [],
    lastAt: now,
  };
}

/** One step back: { history, text } or null when there is nothing to undo. */
export function undoText(history, current) {
  if (!history?.past.length) return null;
  const past = history.past.slice(0, -1);
  return {
    text: history.past[history.past.length - 1],
    history: { past, future: [...history.future, current], lastAt: 0 },
  };
}

/** One step forward: { history, text } or null. */
export function redoText(history, current) {
  if (!history?.future.length) return null;
  const future = history.future.slice(0, -1);
  return {
    text: history.future[history.future.length - 1],
    history: { past: capped([...history.past, current]), future, lastAt: 0 },
  };
}

/**
 * What "restore" needs to put a segment back: its review text, status, lock,
 * score, and whether a reviewer had saved it (the status column shows the
 * file's level again when nobody had).
 */
export function snapshotOf(tu) {
  return {
    reviewLiteral: tu?.reviewLiteral ?? null,
    Status: tu?.Status ?? "NOT_REVIEWED",
    block: Boolean(tu?.block),
    blockReason: tu?.block ? (tu?.blockReason ?? null) : null,
    mtqeV2Score: typeof tu?.mtqeV2Score === "number" ? tu.mtqeV2Score : null,
    reviewed: Boolean(tu?.reviewedAt),
  };
}

const sameSnapshot = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * One undoable entry for a saved action: the acted-on segment first, then the
 * same-source segments it propagated to. `beforeById` = the rows as they were;
 * `after` = the rows the server answered. Null when nothing actually changed.
 */
export function actionEntry({ action, number = null, beforeById, after }) {
  const items = (after ?? [])
    .filter((row) => row?.id && beforeById?.get(row.id))
    .map((row) => ({
      id: row.id,
      before: snapshotOf(beforeById.get(row.id)),
      after: snapshotOf(row),
    }))
    .filter((item) => !sameSnapshot(item.before, item.after));
  return items.length ? { action, number, items } : null;
}

export const emptyActionHistory = () => ({ past: [], future: [] });

/** A new saved action: it becomes the next thing to undo and drops the redo. */
export const recordAction = (history, entry) =>
  entry
    ? { past: capped([...(history?.past ?? []), entry]), future: [] }
    : (history ?? emptyActionHistory());

/** { history, entry } with the entry to undo (restore its `before`), or null. */
export function undoAction(history) {
  if (!history?.past.length) return null;
  const entry = history.past[history.past.length - 1];
  return {
    entry,
    history: { past: history.past.slice(0, -1), future: [...history.future, entry] },
  };
}

/** { history, entry } with the entry to redo (restore its `after`), or null. */
export function redoAction(history) {
  if (!history?.future.length) return null;
  const entry = history.future[history.future.length - 1];
  return {
    entry,
    history: { past: capped([...history.past, entry]), future: history.future.slice(0, -1) },
  };
}
