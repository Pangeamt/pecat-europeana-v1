// Tag rules of the segment editor, as pure functions (no React, no DOM) so
// they can be tested with node:test. Trados-like model (2026-09-30):
//
//   * The reference is the SOURCE's tags -- not the value the editor opened
//     with. Opening with the MT's (or an empty) target used to freeze a broken
//     tag sequence: every save was a 422 and the segment was stuck forever.
//   * A source tag already in the target cannot be removed, and no tag can be
//     duplicated or typed in from outside the source.
//   * A tag the target has but the source does not (invented by the MT) CAN
//     be removed -- it would block the export otherwise.
//   * Missing source tags are INSERTED (chips under the editor, Ctrl+, or
//     "Copy source"); the save check (server) then demands the full set, and
//     for SDLXLIFF the source's order.

const TOKEN = /<\/?[gxbe]\d+\/?>/g;

/** Tag tokens of a text, in order: ["<g1>", "</g1>", "<x2/>"]. */
export function tagList(text) {
  return String(text ?? "").match(new RegExp(TOKEN.source, "g")) ?? [];
}

function counts(list) {
  const map = new Map();
  for (const token of list) map.set(token, (map.get(token) ?? 0) + 1);
  return map;
}

/**
 * Whether an edit from `prev` to `next` keeps the tags valid against `source`.
 * Returns { ok: true } or { ok: false, reason }.
 */
export function checkTagEdit(prev, next, source) {
  const src = counts(tagList(source));
  const before = counts(tagList(prev));
  const after = counts(tagList(next));

  for (const [token, n] of after) {
    const allowed = Math.max(src.get(token) ?? 0, before.get(token) ?? 0);
    if (n > allowed) {
      return {
        ok: false,
        reason: (src.get(token) ?? 0) === 0 && (before.get(token) ?? 0) === 0
          ? `${token} is not a tag of the source`
          : `${token} cannot be duplicated`,
      };
    }
  }
  for (const [token, n] of before) {
    const inSource = src.get(token) ?? 0;
    if (inSource > 0 && (after.get(token) ?? 0) < Math.min(n, inSource)) {
      return { ok: false, reason: `${token} is a source tag and cannot be deleted` };
    }
  }
  return { ok: true };
}

/**
 * Source tags missing from `text`, grouped for insertion: a paired tag as
 * { key: "g1", open: "<g1>", close: "</g1>" }, a standalone one as
 * { key: "x2", open: "<x2/>" }. In source order.
 */
export function missingTags(text, source) {
  const have = counts(tagList(text));
  const out = [];
  const seen = new Set();
  for (const token of tagList(source)) {
    if (token.startsWith("</")) continue;
    const key = token.replace(/[<>/]/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    if ((have.get(token) ?? 0) > 0) continue;
    const paired = !token.endsWith("/>");
    out.push(paired ? { key, open: token, close: `</${key}>` } : { key, open: token });
  }
  return out;
}

/** Whether `text` has exactly the source's tags (set, and order when `ordered`). */
export function tagsComplete(text, source, { ordered = false } = {}) {
  const a = tagList(text);
  const b = tagList(source);
  if (ordered) return a.join("") === b.join("");
  return [...a].sort().join("") === [...b].sort().join("");
}
