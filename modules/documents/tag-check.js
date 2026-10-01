// ONE tag check for server and client (pure, relative imports only, so
// node:test and the browser bundle load it as is). Before this the same rule
// lived in three places with different criteria: `inlineTagsMatch` (set),
// `assertInlineTagsKept` (set, or order for SDLXLIFF) and `tagsComplete`.
//
// The criterion, as in module-file-translate (FT-111): same tags, same count,
// and -- for .sdlxliff -- the SAME ORDER. Reordered tags used to pass the set
// check and then the export silently left the segment out (writer.js gate).

const TAG_RE = /<\/?[gxbe]\d+\/?>/g;

/** The placeholder tags of a text, in order: ["<g1>", "</g1>", "<x2/>"]. */
export function tagList(text) {
  return (String(text ?? "").match(TAG_RE) ?? []).map((tag) => tag.replace(/\s+/g, ""));
}

const count = (list) => list.reduce((m, t) => m.set(t, (m.get(t) ?? 0) + 1), new Map());

/**
 * What is wrong with `target`'s tags against `source`'s:
 *   { ok, missing: [tag], extra: [tag], order: { expected, got } | null }
 * `ordered` (SDLXLIFF) also fails when the same tags come in another order.
 */
export function tagIssue(source, target, { ordered = false } = {}) {
  const expected = tagList(source);
  const got = tagList(target);
  const want = count(expected);
  const have = count(got);
  const missing = [...want].filter(([t, n]) => (have.get(t) ?? 0) < n).map(([t]) => t);
  const extra = [...have].filter(([t, n]) => (want.get(t) ?? 0) < n).map(([t]) => t);
  const order =
    ordered && !missing.length && !extra.length && expected.join("") !== got.join("")
      ? { expected, got }
      : null;
  return { ok: !missing.length && !extra.length && !order, missing, extra, order };
}

/** Human-readable reason, the text of the 422 INLINE_TAGS_MISMATCH. */
export function describeTagIssue(issue) {
  const parts = [];
  if (issue.missing.length) parts.push(`missing ${issue.missing.join(" ")}`);
  if (issue.extra.length) parts.push(`extra ${issue.extra.join(" ")}`);
  if (issue.order) {
    parts.push(`wrong order: expected ${issue.order.expected.join(" ")}, got ${issue.order.got.join(" ")}`);
  }
  return parts.join("; ");
}
