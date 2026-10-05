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

import { describeTagIssue, tagIssue } from "../../modules/documents/tag-check.js";

// The one tag check (same as the server's): the editor banner and the 422 of
// the save agree because they run the same code.
export { describeTagIssue, tagIssue };

const TOKEN = /<\/?[gxbe]\d+\/?>/g;

// ---- Caret anchors -------------------------------------------------------
//
// A tag is an atomic chip the caret cannot enter. Two chips side by side (or a
// chip at the very start or end of the box) leave NO text position between
// them, so the reviewer could neither click nor arrow there. The editor puts a
// zero-width space at those spots: an invisible character the caret can sit
// on. Anchors exist only in the editor's DOM; they are stripped from
// everything that leaves it (state, save, file).
export const CARET_ANCHOR = "​";

/** `text` without the editor's caret anchors. */
export function stripCaretAnchors(text) {
  return String(text ?? "").split(CARET_ANCHOR).join("");
}

/**
 * `text` as the pieces the editor renders, with an anchor wherever a tag has
 * no text beside it: [{ type: "text", value } | { type: "tag", raw } |
 * { type: "anchor" }]. Text with no tags gets no anchors.
 */
export function editorPieces(text) {
  const value = stripCaretAnchors(text);
  const pieces = [];
  let cursor = 0;
  for (const match of value.matchAll(new RegExp(TOKEN.source, "g"))) {
    const before = value.slice(cursor, match.index);
    if (before) pieces.push({ type: "text", value: before });
    else pieces.push({ type: "anchor" }); // start of the box, or tag after tag
    pieces.push({ type: "tag", raw: match[0] });
    cursor = match.index + match[0].length;
  }
  const rest = value.slice(cursor);
  if (rest) pieces.push({ type: "text", value: rest });
  else if (pieces.length) pieces.push({ type: "anchor" }); // tag at the end
  return pieces;
}

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

// ---- "Fix tags" ----------------------------------------------------------
//
// A target whose tags are wrong (missing, extra or in another order) cannot be
// repaired by hand: source tags are atomic chips that cannot be moved, and the
// only way out used to be "Copy source" (retype the translation). `fixTags`
// proposes the target with the SOURCE's tags put back, in the source's order:
// the tags are stripped from the target and re-inserted at the word where they
// sit in the source, scaled to the target's length (proportional position). The
// sequence is the source's by construction, so it passes the tag gate; WHERE
// each tag lands is a heuristic, so the editor applies it as an ordinary edit
// (with Undo) and the reviewer checks it. It never runs by itself.

const wordsOf = (text) => (text === "" ? [] : text.split(" ").filter(Boolean));

/** Where each source tag sits (in words of the visible text) and how it is attached. */
function sourceTagSlots(source) {
  const text = String(source ?? "");
  const visible = text.replace(new RegExp(TOKEN.source, "g"), "");
  const re = new RegExp(TOKEN.source, "g");
  const slots = [];
  let prefix = "";
  let last = 0;
  let match;
  while ((match = re.exec(text))) {
    prefix += text.slice(last, match.index);
    last = match.index + match[0].length;
    const next = visible[prefix.length];
    const prevSpace = prefix === "" || prefix.endsWith(" ");
    const nextSpace = next === undefined || next === " ";
    // alone: own word · front: glued to the next word · back: glued to the
    // previous word · mid: inside a word (glued to its start).
    const type = prevSpace && nextSpace ? "alone" : prevSpace ? "front" : nextSpace ? "back" : "mid";
    const count = wordsOf(prefix).length;
    slots.push({ token: match[0], type, slot: type === "mid" ? Math.max(0, count - 1) : count });
  }
  return { slots, words: wordsOf(visible).length };
}

/** `target` with the source's tags re-inserted, in the source's order. */
export function fixTags(source, target) {
  const plain = String(target ?? "")
    .replace(new RegExp(TOKEN.source, "g"), "")
    .replace(/ {2,}/g, " ")
    .trim();
  const words = wordsOf(plain);
  const { slots, words: sourceWords } = sourceTagSlots(source);
  if (!slots.length) return plain;

  // Source word position -> target word position, never going backwards: the
  // monotonic rule is what keeps the source's order.
  const bySlot = Array.from({ length: words.length + 1 }, () => []);
  let floor = 0;
  for (const tag of slots) {
    const scaled = sourceWords === 0 ? 0 : Math.round((tag.slot * words.length) / sourceWords);
    floor = Math.max(floor, Math.min(words.length, scaled));
    bySlot[floor].push(tag);
  }

  let out = "";
  let space = false; // a space is due before the next item
  for (let k = 0; k <= words.length; k++) {
    const tags = bySlot[k];
    if (tags.length) {
      if (space && tags[0].type !== "back") out += " ";
      out += tags.map((tag) => tag.token).join("");
      const tail = tags[tags.length - 1].type;
      space = tail === "alone" || tail === "back";
    }
    if (k < words.length) {
      if (space) out += " ";
      out += words[k];
      space = true;
    }
  }
  return out;
}
