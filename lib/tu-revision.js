// One history row per segment an action touched (pure, no imports: node:test
// loads it; modules/tus/service.js writes the rows it returns).

const textOf = (tu) => tu?.reviewLiteral ?? tu?.translatedLiteral ?? null;
const scoreOf = (tu) =>
  typeof tu?.mtqeV2Score === "number" ? tu.mtqeV2Score : null;

/**
 * Rows for the history table. `before` / `after` are the acted-on segment
 * as it was and as the save left it; `siblings` = [{ before, after }] for the
 * same-source segments the action propagated to (confirm / reject).
 */
export function buildTuRevisions({ action, before, after, siblings = [], by = null }) {
  const row = (was, now, propagatedFromId) => ({
    tuId: now.id,
    documentId: now.documentId ?? was?.documentId ?? null,
    action,
    textBefore: textOf(was),
    textAfter: textOf(now),
    statusBefore: was?.Status ?? null,
    statusAfter: now.Status ?? null,
    mtqeBefore: scoreOf(was),
    mtqeAfter: scoreOf(now),
    propagatedFromId,
    byUserId: by?.id ?? null,
    byName: by?.name ?? null,
  });
  if (!after?.id) return [];
  return [
    row(before, after, null),
    ...siblings
      .filter((pair) => pair?.after?.id)
      .map((pair) => row(pair.before, pair.after, after.id)),
  ];
}

export const REVISION_ACTION_LABEL = {
  save_draft: "Saved draft",
  approve: "Confirmed",
  reject: "Rejected",
  lock: "Locked",
  unlock: "Unlocked",
  apply_suggestion: "Applied suggestion",
  discard_suggestion: "Discarded suggestion",
  restore: "Restored (undo / redo)",
};
