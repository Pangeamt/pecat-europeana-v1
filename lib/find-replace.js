// Find and replace in the segment editor (Ctrl+H, as in Trados). Pure, no
// imports: node:test loads it and so does the browser bundle. Adapted from
// pecat-pangeanic (src/modules/editor/find.ts).
//
// Text is searched and replaced ONLY outside the inline placeholders
// (<g1>, </g1>, <x2/>, <b1/>, <e1/>), never inside one nor across one: a
// replace can never break the segment's tags.

const SPLIT = /(<\/?[gxbe]\d+\/?>)/gi;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const patternOf = (query, { matchCase = false } = {}) =>
  new RegExp(escapeRe(query), matchCase ? "g" : "gi");

/** Text and tag pieces, alternating: even indexes are text, odd ones tags. */
const parts = (text) => String(text ?? "").split(new RegExp(SPLIT.source, "gi"));

/** How many times `query` appears in the text (outside the tags). */
export function countMatches(text, query, opts = {}) {
  if (!query || !text) return 0;
  let n = 0;
  parts(text).forEach((piece, i) => {
    if (i % 2 === 0) n += piece.match(patternOf(query, opts))?.length ?? 0;
  });
  return n;
}

/** The text with `query` replaced (tags untouched) and how many changes there were. */
export function replaceInText(text, query, replacement, opts = {}) {
  const source = String(text ?? "");
  if (!query) return { text: source, count: 0 };
  let count = 0;
  const out = parts(source).map((piece, i) => {
    if (i % 2 === 1) return piece;
    return piece.replace(patternOf(query, opts), () => {
      count += 1;
      return replacement ?? "";
    });
  });
  return { text: out.join(""), count };
}

/**
 * The rows "Replace all" acts on: unlocked, and whose current target
 * (`textOf(row)`: the unsaved draft, the saved review or the MT) contains
 * `query`.
 */
export const replaceableRows = (rows, textOf, query, opts = {}) =>
  query
    ? (rows ?? []).filter((row) => !row.block && countMatches(textOf(row), query, opts) > 0)
    : [];

/**
 * The status a segment is left with after a replace changed its text: a
 * confirmed one goes back to "not reviewed" (nobody confirmed the new text);
 * any other keeps its status.
 */
export const statusAfterReplace = (status) =>
  status === "ACCEPTED" || status === "EDITED" ? "NOT_REVIEWED" : status;

/**
 * What a bulk edit request has to save, decided before touching the
 * database. `kind`: "replace" (find and replace), "copy_source" (Trados
 * Alt+Shift+Insert) or "clear" (Alt+Shift+Delete, Ctrl+Alt+Space).
 * `items` = [{ tuId, reviewLiteral }] (the new text, computed by the editor;
 * none for "clear"); `rows` = the document's segments; `refuse(row, text)` returns
 * null or { code, message }. Every segment is a job of its own: a replace
 * never propagates to same-source segments (each one contains, or not, the
 * searched text). Returns { jobs: [{ tu, reviewLiteral }], failed, skipped }.
 */
export const BULK_EDIT_KINDS = ["replace", "copy_source", "clear"];

export function planBulkReplace(items, rows, refuse = () => null, kind = "replace") {
  const byId = new Map((rows ?? []).map((row) => [row.id, row]));
  const jobs = [];
  const failed = [];
  const seen = new Set();
  let skipped = 0;
  for (const item of items ?? []) {
    if (!item?.tuId || seen.has(item.tuId)) continue;
    seen.add(item.tuId);
    const tu = byId.get(item.tuId);
    if (!tu) {
      failed.push({ tuId: item.tuId, code: "NOT_FOUND", message: "Segment not found in this document" });
      continue;
    }
    if (tu.block) {
      failed.push({ tuId: tu.id, code: "SEGMENT_LOCKED", message: "This segment is locked" });
      continue;
    }
    // "clear": the reviewer's text goes away (the segment falls back to the
    // MT). Nothing to do when there is no reviewer text and it is not confirmed.
    if (kind === "clear") {
      if (tu.reviewLiteral == null && statusAfterReplace(tu.Status) === tu.Status) {
        skipped += 1;
      } else {
        jobs.push({ tu, reviewLiteral: null });
      }
      continue;
    }
    const reviewLiteral = String(item.reviewLiteral ?? "");
    // Nothing would change (already as asked): not a job, not a failure.
    if (reviewLiteral === (tu.reviewLiteral ?? tu.translatedLiteral ?? "")) {
      skipped += 1;
      continue;
    }
    if (!reviewLiteral.trim()) {
      failed.push({ tuId: tu.id, code: "EMPTY_TARGET", message: "The replace would leave the segment empty" });
      continue;
    }
    const refusal = refuse(tu, reviewLiteral);
    if (refusal) {
      failed.push({ tuId: tu.id, code: refusal.code ?? "REFUSED", message: refusal.message ?? "" });
      continue;
    }
    jobs.push({ tu, reviewLiteral });
  }
  return { jobs, failed, skipped };
}

/** Next match from row `fromId` (F3 / Shift+F3), wrapping around. Null if none. */
export function stepMatch(ids, fromId, delta) {
  if (!ids?.length) return null;
  const here = fromId ? ids.indexOf(fromId) : -1;
  if (here === -1) return delta === 1 ? ids[0] : ids[ids.length - 1];
  return ids[(here + delta + ids.length) % ids.length];
}
