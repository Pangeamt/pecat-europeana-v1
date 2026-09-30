"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button, Tooltip, message } from "antd";
import {
  TAG_TITLE,
  inlineTagRe,
  tagKind,
  tagLabel,
  tagSequence,
} from "../shared/inline-tags";
import { checkTagEdit, missingTags } from "./tag-rules";

// Target editor for segments with inline-code placeholders (<g1>…</g1>,
// <x2/>…), ported from revisions-pangeanic-local (static/js/editor.js): a
// contenteditable where every tag is an ATOMIC chip (contenteditable=false) —
// the caret cannot enter it and it cannot be deleted, duplicated or moved.
// The rules (tag-rules.js) are checked on every input and a bad edit is
// reverted. Since 2026-09-30 the reference is the SOURCE (Trados model), not
// the value the editor opened with: an empty target or an MT that lost a tag
// used to freeze that broken sequence and the segment could never be saved.
// Missing source tags are inserted from the bar under the editor (click, or
// Ctrl+, for the next one; a paired tag wraps the selection) or with "Copy
// source". Quill cannot be used here: it parses the value as HTML and
// silently destroys unknown tags.

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

const TagEditor = ({ value, setValue, onKeyDown, dir = "ltr", source = "" }) => {
  const boxRef = useRef(null);
  // Last valid state: a rejected edit goes back to it.
  const snapshotRef = useRef({ html: "", text: String(value ?? "") });
  // Caret/selection inside the editor, kept so a click on the tag bar (which
  // moves the focus away) still inserts where the user was typing.
  const rangeRef = useRef(null);
  const [text, setText] = useState(String(value ?? ""));

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    box.innerHTML = toHtml(snapshotRef.current.text);
    snapshotRef.current.html = box.innerHTML;
    box.focus();
    placeCaretAtEnd(box);
  }, []);

  const rememberRange = () => {
    const box = boxRef.current;
    const selection = window.getSelection();
    if (!box || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (box.contains(range.commonAncestorContainer)) rangeRef.current = range.cloneRange();
  };

  // Validates the editor's current content against the last valid state.
  const commit = () => {
    const box = boxRef.current;
    if (!box) return;
    const next = toText(box);
    const verdict = checkTagEdit(snapshotRef.current.text, next, source);
    if (!verdict.ok) {
      box.innerHTML = snapshotRef.current.html;
      placeCaretAtEnd(box);
      message.error(`Formatting tags are protected: ${verdict.reason}`);
      return;
    }
    snapshotRef.current = { html: box.innerHTML, text: next };
    setText(next);
    setValue?.(next);
  };

  const handleInput = () => {
    commit();
    rememberRange();
  };

  // Inserts a missing source tag at the caret; a paired tag wraps the
  // current selection (empty selection = empty pair).
  const insertTag = (item) => {
    const box = boxRef.current;
    if (!box || !item) return;
    box.focus();
    let range = rangeRef.current;
    if (!range || !box.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(box);
      range.collapse(false);
    }
    const scratch = document.createElement("div");
    const fragment = document.createDocumentFragment();
    scratch.innerHTML = chipHtml(item.open);
    fragment.appendChild(scratch.firstChild);
    if (item.close) {
      fragment.appendChild(range.extractContents());
      scratch.innerHTML = chipHtml(item.close);
      fragment.appendChild(scratch.firstChild);
    } else {
      range.deleteContents();
    }
    const last = fragment.lastChild;
    range.insertNode(fragment);
    const after = document.createRange();
    after.setStartAfter(last);
    after.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(after);
    rangeRef.current = after.cloneRange();
    commit();
  };

  // Replaces the target with the source, tags included (Trados "Copy source").
  const copySource = () => {
    const box = boxRef.current;
    if (!box) return;
    box.innerHTML = toHtml(source);
    placeCaretAtEnd(box);
    commit();
  };

  const missing = missingTags(text, source);

  // Paste as plain text: HTML would bring duplicated chips (or foreign markup).
  const handlePaste = (event) => {
    event.preventDefault();
    const text = (event.clipboardData || window.clipboardData)
      .getData("text")
      .replace(/[\r\n]+/g, " ");
    document.execCommand("insertText", false, text);
  };

  const handleKeyDown = (event) => {
    // Ctrl+, inserts the next missing source tag (as in Trados).
    if (event.key === "," && event.ctrlKey && missing.length) {
      event.preventDefault();
      insertTag(missing[0]);
      return;
    }
    // Segments are sentences: a raw Enter would insert line breaks the
    // XLIFF target cannot represent. Ctrl+Enter & co. belong to the parent.
    if (event.key === "Enter" && !event.ctrlKey) {
      event.preventDefault();
      return;
    }
    onKeyDown?.(event);
  };

  return (
    <div>
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
        onKeyUp={rememberRange}
        onMouseUp={rememberRange}
        onBeforeInput={(e) => {
          if (e.nativeEvent?.inputType?.startsWith("format")) e.preventDefault();
        }}
        onDragStart={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
      />
      {source && (missing.length > 0 || tagSequence(text) !== tagSequence(source)) && (
        <div className="tag-editor-bar">
          {missing.length > 0 && (
            <>
              <span className="tag-editor-bar-label">Missing tags:</span>
              {missing.map((item) => (
                <Tooltip key={item.key} title="Insert at the cursor (Ctrl+, inserts the next one)">
                  <button
                    type="button"
                    className={`inline-tag ${tagKind(item.open)} tag-editor-insert`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertTag(item)}
                  >
                    {item.close ? `${tagLabel(item.open)}…/${item.key}` : tagLabel(item.open)}
                  </button>
                </Tooltip>
              ))}
            </>
          )}
          <Button size="small" type="link" onMouseDown={(e) => e.preventDefault()} onClick={copySource}>
            Copy source
          </Button>
        </div>
      )}
    </div>
  );
};

export default TagEditor;
