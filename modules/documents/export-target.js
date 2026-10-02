// What goes into the exported file for a segment (pure, relative imports only).
//
// A reviewer's text counts only once it is APPROVED (ACCEPTED / EDITED). A draft
// saved with the editor's Save button (reviewLiteral without approval), or the
// old text of a segment that was later rejected, never leaves the app: the
// export falls back to the machine translation.

/** True when the reviewer's text (reviewLiteral) is an approved one. */
export function isApproved(tu) {
  return tu.Status === "ACCEPTED" || tu.Status === "EDITED";
}

/** The target to export for `tu`: approved review, else the MT, else "". */
export function exportTarget(tu) {
  return (isApproved(tu) && tu.reviewLiteral) || tu.translatedLiteral || "";
}
