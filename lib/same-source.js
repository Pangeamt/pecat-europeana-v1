// Which segments a confirm / reject propagates to, and with what text (pure,
// relative imports only: node:test loads it).
//
// 1. Same source, character by character: capitals, accents, no-break spaces
//    and trailing spaces count. The database cannot decide it on its own:
//    `tus.srcLiteral` is utf8mb4_unicode_ci, which reads "software" and
//    "Software", "resume" and "résumé", a space and a no-break space, and
//    "abc" and "abc " as equal. Propagating across those copied one segment's
//    capitalisation onto the other (term lists, 2026-11-11).
// 2. Same source except the NUMBERS of its inline tags: "ne<g1182>o</g1182>s"
//    and "ne<g1226>o</g1226>s" are the same sentence (the number is the tag's
//    id inside the file). The text propagates with its tags renumbered for
//    that segment, and only if it passes the editor's own tag check.

import { tagIssue } from "../modules/documents/tag-check.js";

// Same placeholders as modules/documents/tag-check.js.
const TAG_RE = /<(\/?)([gxbe])(\d+)(\/?)>/g;

const hasTags = (text) => /<\/?[gxbe]\d+\/?>/.test(text);

/** Whether two sources are the same text, character by character. */
export function isSameSource(a, b) {
  return typeof a === "string" && typeof b === "string" && a === b;
}

/** The rows whose source is exactly `srcLiteral` (others are dropped). */
export function keepExactSource(rows, srcLiteral) {
  return (rows ?? []).filter((row) => isSameSource(row?.srcLiteral, srcLiteral));
}

/**
 * The source with its tag numbers replaced by their order of appearance
 * ("ne<g1182>o</g1182>s<x7/>" -> "ne<g1>o</g1>s<x2/>"); everything else as is.
 * Two sources with the same shape differ at most in their tag numbers.
 */
export function sourceShape(source) {
  if (typeof source !== "string") return null;
  const order = new Map();
  return source.replace(TAG_RE, (tag, close, kind, id, selfClose) => {
    const key = `${kind}${id}`;
    if (!order.has(key)) order.set(key, order.size + 1);
    return `<${close}${kind}${order.get(key)}${selfClose}>`;
  });
}

/** Tag ids of `from` -> tag ids of `to`, by order of appearance ("g1182" -> "1226"). */
function tagIdMap(from, to) {
  const ids = (text) => {
    const seen = [];
    for (const [, , kind, id] of text.matchAll(TAG_RE)) {
      if (!seen.includes(`${kind}${id}`)) seen.push(`${kind}${id}`);
    }
    return seen;
  };
  const a = ids(from);
  const b = ids(to);
  if (a.length !== b.length) return null;
  return new Map(a.map((key, index) => [key, b[index].slice(1)]));
}

/**
 * `text` (written for source `from`) with its tags renumbered for source `to`
 * (same shape). Null when a tag of the text has no counterpart in `from`.
 */
export function renumberTags(text, from, to) {
  if (typeof text !== "string") return null;
  const map = tagIdMap(from, to);
  if (!map) return null;
  let unknown = false;
  const out = text.replace(TAG_RE, (tag, close, kind, id, selfClose) => {
    const next = map.get(`${kind}${id}`);
    if (next === undefined) {
      unknown = true;
      return tag;
    }
    return `<${close}${kind}${next}${selfClose}>`;
  });
  return unknown ? null : out;
}

/**
 * Where a confirm / reject of `tu` propagates, from `candidates` (a wide
 * database match): [{ row, text }]. `text` is what that row gets as its
 * review text -- `undefined` when the action carries none (a reject, or a
 * confirm of the MT as is). Identical sources get the same text; same-shape
 * sources the text with renumbered tags, and only when it passes the tag
 * check (`ordered` = the document's format checks tag order). Anything else
 * is left alone.
 */
export function planPropagation(tu, text, candidates, { ordered = true } = {}) {
  const source = tu?.srcLiteral;
  if (typeof source !== "string") return [];
  const shape = sourceShape(source);
  const withText = typeof text === "string" && text !== "";
  const plan = [];
  for (const row of candidates ?? []) {
    if (!row || row.id === tu.id || typeof row.srcLiteral !== "string") continue;
    if (isSameSource(row.srcLiteral, source)) {
      plan.push({ row, text: withText ? text : undefined });
      continue;
    }
    if (!hasTags(source) || sourceShape(row.srcLiteral) !== shape) continue;
    if (!withText) {
      plan.push({ row, text: undefined });
      continue;
    }
    const renumbered = renumberTags(text, source, row.srcLiteral);
    if (renumbered === null) continue;
    if (!tagIssue(row.srcLiteral, renumbered, { ordered }).ok) continue;
    plan.push({ row, text: renumbered });
  }
  return plan;
}

/**
 * The database prefilter for the propagation candidates of `source`: the
 * exact source when it has no tags; with tags, its longest piece of text
 * (the tag numbers may differ). Null = no candidates (only tags, no text).
 * Either way the column's collation makes it a superset: `planPropagation`
 * decides.
 */
export function candidateFilter(source) {
  if (typeof source !== "string") return null;
  if (!hasTags(source)) return { srcLiteral: source };
  const longest = source
    .split(/<\/?[gxbe]\d+\/?>/)
    .reduce((best, piece) => (piece.length > best.length ? piece : best), "");
  return longest.trim() ? { srcLiteral: { contains: longest } } : { srcLiteral: source };
}

/** Key of "the same source" for planning: the shape (tag numbers aside). */
export const propagationKey = sourceShape;
