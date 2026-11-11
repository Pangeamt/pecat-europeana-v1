// What goes into the exported file for a segment (pure, relative imports only).
//
// A reviewer's text counts only once it is APPROVED (ACCEPTED / EDITED). A draft
// saved with the editor's Save button (reviewLiteral without approval), or the
// old text of a segment that was later rejected, never leaves the app: the
// export falls back to the machine translation.
//
// A segment hidden at import (visibility-rules.js: a bare URL) is never sent
// to the MT and never shown to the reviewer, so it has no text of its own: it
// leaves with its SOURCE as target, unconfirmed -- what a translator does with
// it in Trados (copy source to target). Until 2026-11-11 its target left
// empty in SDLXLIFF/XLIFF (7 URLs per Leginda manual). An approved text or an
// MT, if it ever has one, still wins.

/** True when the reviewer's text (reviewLiteral) is an approved one. */
export function isApproved(tu) {
  return tu.Status === "ACCEPTED" || tu.Status === "EDITED";
}

/** True when `tu` leaves with its own source as target (hidden at import, no text of its own). */
export function leavesWithSource(tu) {
  return (
    tu?.visible === false &&
    !(isApproved(tu) && tu.reviewLiteral) &&
    !tu.translatedLiteral &&
    Boolean(tu.srcLiteral)
  );
}

/** The target to export for `tu`: approved review, else the MT, else the source of a hidden segment, else "". */
export function exportTarget(tu) {
  return (
    (isApproved(tu) && tu.reviewLiteral) ||
    tu.translatedLiteral ||
    (leavesWithSource(tu) ? tu.srcLiteral : "")
  );
}
