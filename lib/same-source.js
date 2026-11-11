// Which segments a confirm / reject propagates to: only those whose source is
// IDENTICAL, character by character (pure, no imports: node:test loads it).
//
// The database cannot decide it on its own: `tus.srcLiteral` is
// utf8mb4_unicode_ci, which reads "software" and "Software", "resume" and
// "résumé", a space and a no-break space, and "abc" and "abc " as equal.
// Propagating across those copied one segment's capitalisation onto the
// other (term lists, 2026-11-11). The query stays as a wide first cut and
// this filter keeps the exact ones.

/** Whether two sources are the same text, character by character. */
export function isSameSource(a, b) {
  return typeof a === "string" && typeof b === "string" && a === b;
}

/** The rows whose source is exactly `srcLiteral` (others are dropped). */
export function keepExactSource(rows, srcLiteral) {
  return (rows ?? []).filter((row) => isSameSource(row?.srcLiteral, srcLiteral));
}
