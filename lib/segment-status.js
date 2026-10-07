// What the editor's status column shows for a segment. Pure module (no
// imports) so node:test loads it; the icons live in
// components/Tus/SegmentStatusIcon.jsx.
//
// The grid has its OWN, short set of situations (decision of 2026-10-06) --
// it does not mirror the file's confirmation levels:
//
//   LOCKED     it came locked in the file, or was locked here (exact memory
//              match, manual lock): one icon, whatever the file said about it
//   PENDING    nobody has confirmed it yet -- what DAAIT translated and what
//              the client's file already carried, unlocked, alike
//   CONFIRMED  a reviewer confirmed it without changing the text
//   EDITED     a reviewer confirmed it with changes
//   REJECTED   a reviewer rejected it
//
// What the EXPORTED file says is a separate matter (sdlxliff/writer.js): there
// every segment gets the confirmation level Trados expects.

export const SEGMENT_STATE = {
  LOCKED: "LOCKED",
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  EDITED: "EDITED",
  REJECTED: "REJECTED",
};

export const SEGMENT_STATE_LABEL = {
  LOCKED: "Locked",
  PENDING: "Not reviewed",
  CONFIRMED: "Confirmed",
  EDITED: "Confirmed with changes",
  REJECTED: "Rejected",
};

/**
 * The situation to show. `hasDraft` = text typed in the editor and not saved
 * yet: the segment is being worked on again, so it reads as not reviewed
 * until it is confirmed.
 */
export function segmentState(tu, { hasDraft = false } = {}) {
  if (!tu) return SEGMENT_STATE.PENDING;
  if (tu.block) return SEGMENT_STATE.LOCKED;
  if (hasDraft) return SEGMENT_STATE.PENDING;
  if (tu.Status === "REJECTED") return SEGMENT_STATE.REJECTED;
  if (tu.Status === "EDITED") return SEGMENT_STATE.EDITED;
  if (tu.Status === "ACCEPTED") return SEGMENT_STATE.CONFIRMED;
  return SEGMENT_STATE.PENDING;
}

const MT_ORIGINS = new Set(["mt", "nmt", "amt", "adaptive-mt"]);

const hasTarget = (tu) =>
  Boolean(String(tu?.reviewLiteral ?? tu?.translatedLiteral ?? "").trim());

/**
 * Where the target came from, as the badge next to the status icon:
 * { text: "AT" | "87%", kind: "mt" | "fuzzy", edited } or null. `edited` = the
 * text is no longer what that origin produced (the badge loses its fill).
 * Exact matches (100%, context, perfect match) carry NO badge, and neither do
 * locked segments: the column stays as plain as the CAT tool's.
 */
export function segmentOrigin(tu, { hasDraft = false } = {}) {
  if (!tu || tu.block) return null;
  const edited =
    hasDraft ||
    tu.Status === "EDITED" ||
    (tu.reviewedAt != null &&
      tu.reviewLiteral != null &&
      tu.reviewLiteral !== tu.translatedLiteral);

  const origin = String(tu.fileOrigin ?? "").toLowerCase();
  if (tu.fileTarget === true) {
    if (MT_ORIGINS.has(origin)) return { text: "AT", kind: "mt", edited };
    if (
      origin === "tm" &&
      typeof tu.filePercent === "number" &&
      tu.filePercent < 100
    ) {
      return { text: `${tu.filePercent}%`, kind: "fuzzy", edited };
    }
    return null;
  }
  // Filled in by PECAT-E (DAAIT's machine translation). Documents imported
  // before the file columns existed only say so through their Status.
  if (tu.fileTarget === false && hasTarget(tu) && tu.translatedLiteral) {
    return { text: "AT", kind: "mt", edited };
  }
  if (tu.fileTarget == null && tu.Status === "TRANSLATED_MT") {
    return { text: "AT", kind: "mt", edited };
  }
  return null;
}

// The options of the status column's filter: everything that column can show.
// Two groups -- the situation (the icon) and the origin (the badge next to
// it). The four review values keep the codes the filter always had.
export const STATUS_FILTER_STATES = {
  NOT_REVIEWED: SEGMENT_STATE.PENDING,
  ACCEPTED: SEGMENT_STATE.CONFIRMED,
  EDITED: SEGMENT_STATE.EDITED,
  REJECTED: SEGMENT_STATE.REJECTED,
  LOCKED: SEGMENT_STATE.LOCKED,
};
export const STATUS_FILTER_ORIGINS = {
  ORIGIN_MT: "mt",
  ORIGIN_FUZZY: "fuzzy",
};
export const STATUS_FILTER_VALUES = [
  ...Object.keys(STATUS_FILTER_STATES),
  ...Object.keys(STATUS_FILTER_ORIGINS),
];

/**
 * Whether a segment passes the status filter. Within a group the options
 * add up ("not reviewed" OR "rejected"); the two groups narrow each other
 * ("not reviewed" AND "machine translation"). An empty selection lets
 * everything through. `hasDraft` as in segmentState / segmentOrigin.
 */
export function matchesStatusSelection(values, tu, { hasDraft = false } = {}) {
  const selected = values ?? [];
  const states = selected.map((value) => STATUS_FILTER_STATES[value]).filter(Boolean);
  const origins = selected.map((value) => STATUS_FILTER_ORIGINS[value]).filter(Boolean);
  if (states.length > 0 && !states.includes(segmentState(tu, { hasDraft }))) return false;
  if (origins.length > 0 && !origins.includes(segmentOrigin(tu, { hasDraft })?.kind)) return false;
  return true;
}

/** The number the grid shows: the CAT tool's when known, else document order. */
export function segmentNumberOf(tu, fallback = null) {
  if (typeof tu?.segmentNumber === "number") return tu.segmentNumber;
  if (typeof tu?.count === "number") return tu.count + 1;
  return fallback;
}
