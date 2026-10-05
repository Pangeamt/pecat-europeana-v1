// What the editor's status column shows for a segment, the way a CAT tool does
// (Trados Studio's seven confirmation levels plus the origin of the target).
// Pure module (no imports) so node:test loads it; the icons live in
// components/Tus/SegmentStatusIcon.jsx.
//
// Rule: a segment a reviewer has saved HERE shows what PECAT-E did to it;
// until then it shows what the client's file said (Tu.fileConf / fileOrigin,
// stored at import). Documents imported before those columns existed, and
// formats other than SDLXLIFF / XLIFF, fall back to PECAT-E's own Status.

export const SEGMENT_STATE = {
  NOT_TRANSLATED: "NOT_TRANSLATED",
  DRAFT: "DRAFT",
  TRANSLATED: "TRANSLATED",
  TRANSLATION_REJECTED: "TRANSLATION_REJECTED",
  TRANSLATION_APPROVED: "TRANSLATION_APPROVED",
  SIGN_OFF_REJECTED: "SIGN_OFF_REJECTED",
  SIGNED_OFF: "SIGNED_OFF",
};

export const SEGMENT_STATE_LABEL = {
  NOT_TRANSLATED: "Not translated",
  DRAFT: "Draft",
  TRANSLATED: "Translated",
  TRANSLATION_REJECTED: "Translation rejected",
  TRANSLATION_APPROVED: "Translation approved",
  SIGN_OFF_REJECTED: "Sign-off rejected",
  SIGNED_OFF: "Signed off",
};

// <sdl:seg conf="..."> (SDLXLIFF) and the XLIFF 1.2 / 2.x states, lowercased.
const FILE_CONF = {
  draft: SEGMENT_STATE.DRAFT,
  translated: SEGMENT_STATE.TRANSLATED,
  rejectedtranslation: SEGMENT_STATE.TRANSLATION_REJECTED,
  approvedtranslation: SEGMENT_STATE.TRANSLATION_APPROVED,
  rejectedsignoff: SEGMENT_STATE.SIGN_OFF_REJECTED,
  approvedsignoff: SEGMENT_STATE.SIGNED_OFF,
  // XLIFF 1.2 <target state>
  new: SEGMENT_STATE.NOT_TRANSLATED,
  "needs-translation": SEGMENT_STATE.NOT_TRANSLATED,
  "needs-l10n": SEGMENT_STATE.DRAFT,
  "needs-adaptation": SEGMENT_STATE.DRAFT,
  "needs-review-translation": SEGMENT_STATE.TRANSLATION_REJECTED,
  "needs-review-l10n": SEGMENT_STATE.SIGN_OFF_REJECTED,
  "needs-review-adaptation": SEGMENT_STATE.SIGN_OFF_REJECTED,
  "signed-off": SEGMENT_STATE.TRANSLATION_APPROVED,
  final: SEGMENT_STATE.SIGNED_OFF,
  // XLIFF 2.x <segment state>
  initial: SEGMENT_STATE.NOT_TRANSLATED,
  reviewed: SEGMENT_STATE.TRANSLATION_APPROVED,
};

const hasTarget = (tu) =>
  Boolean(String(tu?.reviewLiteral ?? tu?.translatedLiteral ?? "").trim());

/**
 * The confirmation level to show. `hasDraft` = text typed in the editor and
 * not saved yet (it turns a confirmed segment back into a draft, as editing
 * does in a CAT tool).
 */
export function segmentState(tu, { hasDraft = false } = {}) {
  if (!tu) return SEGMENT_STATE.NOT_TRANSLATED;
  if (hasDraft) return SEGMENT_STATE.DRAFT;

  // Touched in PECAT-E: a reviewer saved it (draft, confirm or reject).
  if (tu.reviewedAt) {
    if (tu.Status === "REJECTED") return SEGMENT_STATE.TRANSLATION_REJECTED;
    if (tu.Status === "ACCEPTED" || tu.Status === "EDITED") {
      return SEGMENT_STATE.TRANSLATION_APPROVED;
    }
    return SEGMENT_STATE.DRAFT; // a saved draft, not confirmed yet
  }

  // Untouched, and PECAT-E's MT filled it in: a draft, whatever the file said.
  if (tu.Status === "TRANSLATED_MT" && tu.fileTarget !== true) {
    return hasTarget(tu) ? SEGMENT_STATE.DRAFT : SEGMENT_STATE.NOT_TRANSLATED;
  }

  // Untouched: what the client's file said.
  const fromFile = FILE_CONF[String(tu.fileConf ?? "").toLowerCase()];
  if (fromFile) {
    // A level above "not translated" with no text is still not translated.
    return hasTarget(tu) ? fromFile : SEGMENT_STATE.NOT_TRANSLATED;
  }
  if (!hasTarget(tu)) return SEGMENT_STATE.NOT_TRANSLATED;

  // No file information (older import, other formats): PECAT-E's own status.
  if (tu.Status === "REJECTED") return SEGMENT_STATE.TRANSLATION_REJECTED;
  if (tu.blockReason === "TM_MATCH" || tu.blockReason === "INTERNAL") {
    return SEGMENT_STATE.TRANSLATED;
  }
  if (tu.Status === "ACCEPTED" || tu.Status === "EDITED") {
    return SEGMENT_STATE.TRANSLATION_APPROVED;
  }
  return tu.Status === "TRANSLATED_MT" ? SEGMENT_STATE.DRAFT : SEGMENT_STATE.TRANSLATED;
}

const MT_ORIGINS = new Set(["mt", "nmt", "amt", "adaptive-mt"]);

/**
 * Where the target came from, as the badge next to the status icon:
 * { text: "AT" | "CM" | "PM" | "100%" | "87%", kind: "mt" | "exact" | "fuzzy",
 *   edited } or null (typed by hand, or unknown). `edited` = the text is no
 * longer what that origin produced (the badge loses its fill, as in Trados).
 */
export function segmentOrigin(tu, { hasDraft = false } = {}) {
  if (!tu) return null;
  const edited =
    hasDraft ||
    tu.Status === "EDITED" ||
    (tu.reviewedAt != null &&
      tu.reviewLiteral != null &&
      tu.reviewLiteral !== tu.translatedLiteral);

  const origin = String(tu.fileOrigin ?? "").toLowerCase();
  const fromFile = tu.fileTarget === true;
  if (fromFile && MT_ORIGINS.has(origin)) return { text: "AT", kind: "mt", edited };
  if (fromFile && origin === "document-match") {
    return { text: "PM", kind: "exact", edited };
  }
  if (fromFile && origin === "tm" && typeof tu.filePercent === "number") {
    if (tu.filePercent >= 100) {
      const context = String(tu.fileTextMatch ?? "").toLowerCase() === "sourceandtarget";
      return { text: context ? "CM" : "100%", kind: "exact", edited };
    }
    return { text: `${tu.filePercent}%`, kind: "fuzzy", edited };
  }

  // Filled in by PECAT-E: an exact TM match, or DAAIT's machine translation.
  if (tu.blockReason === "TM_MATCH") return { text: "100%", kind: "exact", edited };
  if (!fromFile && hasTarget(tu) && tu.translatedLiteral && tu.fileTarget === false) {
    return { text: "AT", kind: "mt", edited };
  }
  if (tu.fileTarget == null && tu.Status === "TRANSLATED_MT") {
    return { text: "AT", kind: "mt", edited };
  }
  return null;
}

/** The number the grid shows: the CAT tool's when known, else document order. */
export function segmentNumberOf(tu, fallback = null) {
  if (typeof tu?.segmentNumber === "number") return tu.segmentNumber;
  if (typeof tu?.count === "number") return tu.count + 1;
  return fallback;
}
