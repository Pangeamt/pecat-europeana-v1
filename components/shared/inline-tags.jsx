"use client";

import React from "react";

// Inline-code placeholders produced by modules/documents/xliff.js:
// <g1>…</g1> (paired), <x2/> <b1/> <e1/> (standalone). Deliberately narrow
// (letter + digits only) so real text like "x < 5" or "<total>" never becomes
// a chip. Must stay in sync with TOKEN_RE in modules/documents/xliff.js.
// A global regex is stateful (lastIndex survives between calls and matchAll
// clones it WITH its position), so every consumer gets a fresh clone.
const TAG_PATTERN = /<\/?[gxbe]\d+\/?>/;
export const inlineTagRe = () => new RegExp(TAG_PATTERN.source, "g");

export const hasInlineTags = (text) => TAG_PATTERN.test(String(text ?? ""));

/** Text without its placeholders: for search, word counts and anything sent
 *  to a TM/QE/LLM (they get the text only; see modules/documents/qe-payload.js). */
export const stripInlineTags = (text) =>
  String(text ?? "")
    .replace(inlineTagRe(), "")
    .replace(/ {2,}/g, " ")
    .trim();

/** The tags of a text, concatenated in order: the editor invariant compares
 *  this against the original to detect deleted/duplicated/reordered tags. */
export const tagSequence = (text) =>
  (String(text ?? "").match(inlineTagRe()) || []).join("");

export function tagLabel(raw) {
  if (raw.startsWith("</")) return "/" + raw.slice(2, -1);
  if (raw.endsWith("/>")) return raw.slice(1, -2);
  return raw.slice(1, -1);
}

export function tagKind(raw) {
  if (raw.startsWith("</")) return "close";
  if (raw.endsWith("/>")) return "empty";
  return "open";
}

export const TAG_TITLE = (raw) =>
  `Formatting tag ${raw} · cannot be deleted or moved`;

/** "<g1>", "</g1>" and "<g1 />" all share the key "g1" (the key of tagInfo). */
export const tagKey = (raw) => raw.replace(/[<>/\s]/g, "");

/**
 * What a chip shows. `info` is the tag's entry of the segment's `tagInfo`
 * ({ name, detail?, close?, equiv?, locked?, lockedText? }, see
 * modules/documents/sdlxliff/tagdefs.js): the TYPE of the tag (glossary, unit,
 * &deg;...) as Trados shows it, and everything we know about it on hover. A
 * tag without info (unknown type, or a document imported before tagInfo
 * existed) looks as it always did. One place for the grid, the editor and the
 * tag bar, so the three always agree.
 */
export function chipAttrs(raw, info) {
  const kind = tagKind(raw);
  if (!info?.name) {
    return { className: `inline-tag ${kind}`, label: tagLabel(raw), title: TAG_TITLE(raw) };
  }
  const code = kind === "close" ? (info.close ?? info.detail) : info.detail;
  const lines = [`${info.name}${info.locked ? " (locked)" : ""} · ${raw}`];
  if (code) lines.push(code);
  if (info.equiv) lines.push(`equiv-text: ${info.equiv}`);
  if (info.lockedText) lines.push(`Locked text: ${info.lockedText}`);
  lines.push("Protected tag · cannot be deleted or moved");
  return {
    className: `inline-tag ${kind} typed${info.locked ? " locked" : ""}`,
    label: info.name,
    title: lines.join("\n"),
  };
}

export function TagChip({ raw, info }) {
  const { className, label, title } = chipAttrs(raw, info);
  return (
    <span
      className={className}
      contentEditable={false}
      draggable={false}
      data-raw={raw}
      title={title}
    >
      {label}
    </span>
  );
}

/**
 * Plain text with placeholders -> text + chips, for read-only cells.
 * `renderText` customizes the text parts (e.g. the search Highlighter);
 * chips are never part of the highlight, they are not searchable text.
 */
export function TagText({ text, renderText, info }) {
  const value = String(text ?? "");
  const parts = [];
  let cursor = 0;
  for (const match of value.matchAll(inlineTagRe())) {
    if (match.index > cursor) {
      const part = value.slice(cursor, match.index);
      parts.push(
        <React.Fragment key={parts.length}>
          {renderText ? renderText(part) : part}
        </React.Fragment>,
      );
    }
    parts.push(<TagChip key={parts.length} raw={match[0]} info={info?.[tagKey(match[0])]} />);
    cursor = match.index + match[0].length;
  }
  const rest = value.slice(cursor);
  if (rest) {
    parts.push(
      <React.Fragment key={parts.length}>
        {renderText ? renderText(rest) : rest}
      </React.Fragment>,
    );
  }
  return <>{parts}</>;
}
