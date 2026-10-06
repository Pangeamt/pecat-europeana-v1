// When a document's processed file may be delivered (pure module, no imports:
// node:test loads it; the download services and the editor share it).
//
// A segment is DONE when it is locked (it came locked in the file, or was
// locked here) or a reviewer confirmed it (with or without changes). A segment
// nobody has confirmed, and a REJECTED one, are not done. Hidden segments do
// not count either way: the reviewer never sees them.
//
// The processed file is offered only when every segment is done. An
// administrator may still take it earlier, for a partial delivery, after
// being told what is missing.

export const isSegmentDone = (tu) =>
  Boolean(tu?.block) || tu?.Status === "ACCEPTED" || tu?.Status === "EDITED";

/** { total, done, locked, confirmed, pending, rejected, complete } over the visible segments. */
export function completionOf(tus) {
  const out = { total: 0, done: 0, locked: 0, confirmed: 0, pending: 0, rejected: 0 };
  for (const tu of tus ?? []) {
    if (tu?.visible === false) continue;
    out.total += 1;
    if (tu.block) {
      out.locked += 1;
      out.done += 1;
    } else if (tu.Status === "ACCEPTED" || tu.Status === "EDITED") {
      out.confirmed += 1;
      out.done += 1;
    } else {
      out.pending += 1;
      if (tu.Status === "REJECTED") out.rejected += 1;
    }
  }
  return { ...out, complete: out.total > 0 && out.pending === 0 };
}

// Link ids of a partial delivery an administrator asked for carry this prefix:
// the download itself (public, by link id) tells them apart without a session.
export const PARTIAL_LINK_PREFIX = "partial-";

/** May this download go ahead? `partialLink` = the link was issued as a partial delivery. */
export const mayDeliver = (completion, { partialLink = false } = {}) =>
  Boolean(completion?.complete) || partialLink;

/** "report.xml.sdlxliff" -> "report.xml.processed.sdlxliff": never the original's own name. */
export function processedFilename(filename) {
  const name = String(filename ?? "").trim() || "document";
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return `${name}.processed`;
  return `${name.slice(0, dot)}.processed${name.slice(dot)}`;
}

/**
 * The segments a "confirm everything in the filter" acts on: the visible rows
 * nobody has confirmed, unlocked, with a text to confirm. Rejected ones are
 * left alone -- a reviewer decided that, on purpose.
 */
export const confirmableRows = (rows, textOf) =>
  (rows ?? []).filter(
    (row) =>
      !row.block &&
      row.Status !== "ACCEPTED" &&
      row.Status !== "EDITED" &&
      row.Status !== "REJECTED" &&
      Boolean(String(textOf(row) ?? "").trim()),
  );
