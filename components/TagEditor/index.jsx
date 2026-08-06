"use client";

import React, { useEffect, useRef } from "react";
import { message } from "antd";
import {
  TAG_TITLE,
  inlineTagRe,
  tagKind,
  tagLabel,
  tagSequence,
} from "../shared/inline-tags";

// Target editor for segments with inline-code placeholders (<g1>…</g1>,
// <x2/>…), ported from revisions-pangeanic-local (static/js/editor.js): a
// contenteditable where every tag is an ATOMIC chip (contenteditable=false) —
// the caret cannot enter it and it cannot be deleted, duplicated or moved.
// The invariant is enforced on input: if the tag sequence differs from the
// value the editor opened with, the edit is reverted. Quill cannot be used
// here: it parses the value as HTML and silently destroys unknown tags.

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

function chipHtml(raw) {
  return (
    `<span class="inline-tag ${tagKind(raw)}" contenteditable="false" draggable="false"` +
    ` data-raw="${esc(raw)}" title="${esc(TAG_TITLE(raw))}">${esc(tagLabel(raw))}</span>`
  );
}

/** Plain text with placeholders -> editor HTML with chips. */
function toHtml(text) {
  const value = String(text ?? "");
  let html = "";
  let cursor = 0;
  for (const match of value.matchAll(inlineTagRe())) {
    html += esc(value.slice(cursor, match.index));
    html += chipHtml(match[0]);
    cursor = match.index + match[0].length;
  }
  return html + esc(value.slice(cursor));
}

/** Editor DOM -> plain text with placeholders (chips serialize via data-raw). */
function toText(node) {
  let out = "";
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) out += child.nodeValue;
    else if (child.dataset && child.dataset.raw) out += child.dataset.raw;
    else if (child.tagName === "BR") out += "";
    else out += toText(child); // <mark> or other wrappers the browser adds
  }
  return out;
}

function placeCaretAtEnd(box) {
  const range = document.createRange();
  range.selectNodeContents(box);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

const TagEditor = ({ value, setValue, onKeyDown, dir = "ltr" }) => {
  const boxRef = useRef(null);
  // Frozen at mount: the invariant compares against what the editor opened
  // with, not against the live prop (which follows the user's own edits).
  const initialRef = useRef(String(value ?? ""));

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    box.innerHTML = toHtml(initialRef.current);
    box.dataset.snapshot = box.innerHTML;
    box.focus();
    placeCaretAtEnd(box);
  }, []);

  const handleInput = () => {
    const box = boxRef.current;
    if (!box) return;
    const text = toText(box);

    // Invariant: same tags, same order, as when the segment was opened.
    if (tagSequence(text) !== tagSequence(initialRef.current)) {
      box.innerHTML = box.dataset.snapshot;
      placeCaretAtEnd(box);
      message.error("Formatting tags cannot be deleted or reordered");
      return;
    }

    box.dataset.snapshot = box.innerHTML;
    setValue?.(text);
  };

  // Paste as plain text: HTML would bring duplicated chips (or foreign markup).
  const handlePaste = (event) => {
    event.preventDefault();
    const text = (event.clipboardData || window.clipboardData)
      .getData("text")
      .replace(/[\r\n]+/g, " ");
    document.execCommand("insertText", false, text);
  };

  const handleKeyDown = (event) => {
    // Segments are sentences: a raw Enter would insert line breaks the
    // XLIFF target cannot represent. Ctrl+Enter & co. belong to the parent.
    if (event.key === "Enter" && !event.ctrlKey) {
      event.preventDefault();
      return;
    }
    onKeyDown?.(event);
  };

  return (
    <div
      ref={boxRef}
      className="tag-editor"
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      dir={dir}
      style={{ textAlign: dir === "rtl" ? "right" : "left" }}
      onInput={handleInput}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      onBeforeInput={(e) => {
        if (e.nativeEvent?.inputType?.startsWith("format")) e.preventDefault();
      }}
      onDragStart={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    />
  );
};

export default TagEditor;
