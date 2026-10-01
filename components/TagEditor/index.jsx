"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button, Tooltip, message } from "antd";
import {
  TagText,
  chipAttrs,
  inlineTagRe,
  tagKey,
  tagKind,
  tagLabel,
  tagSequence,
} from "../shared/inline-tags";
import { checkTagEdit, describeTagIssue, fixTags, missingTags, tagIssue } from "./tag-rules";

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

// `info` = the segment's tagInfo (type and code of each tag, see chipAttrs).
function chipHtml(raw, info) {
  const { className, label, title } = chipAttrs(raw, info?.[tagKey(raw)]);
  return (
    `<span class="${className}" contenteditable="false" draggable="false"` +
    ` data-raw="${esc(raw)}" title="${esc(title)}">${esc(label)}</span>`
  );
}

/** Plain text with placeholders -> editor HTML with chips. */
function toHtml(text, info) {
  const value = String(text ?? "");
  let html = "";
  let cursor = 0;
  for (const match of value.matchAll(inlineTagRe())) {
    html += esc(value.slice(cursor, match.index));
    html += chipHtml(match[0], info);
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

const tagSequenceList = (text) => String(text ?? "").match(inlineTagRe()) ?? [];

// Label of a "missing tag" button: the tag's type when known (Trados), else
// the placeholder as before.
function chipLabel(item, info) {
  const name = info?.[item.key]?.name;
  if (name) return item.close ? `${name}…/` : name;
  return item.close ? `${tagLabel(item.open)}…/${item.key}` : tagLabel(item.open);
}

function placeCaretAtEnd(box) {
  const range = document.createRange();
  range.selectNodeContents(box);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

const TagEditor = ({
  value,
  setValue,
  onKeyDown,
  dir = "ltr",
  source = "",
  tagInfo = null,
  // SDLXLIFF: the target must carry the source's tags in the SOURCE'S ORDER
  // (the export writes nothing else); other formats only need the same set.
  ordered = false,
}) => {
  const boxRef = useRef(null);
  // Latest tagInfo for the DOM helpers below (they live in closures).
  const infoRef = useRef(tagInfo);
  useEffect(() => {
    infoRef.current = tagInfo;
  }, [tagInfo]);
  // State before a "Fix tags", for Undo.
  const [undoState, setUndoState] = useState(null);
  // Last valid state: a rejected edit goes back to it.
  const snapshotRef = useRef({ html: "", text: String(value ?? "") });
  // Caret/selection inside the editor, kept so a click on the tag bar (which
  // moves the focus away) still inserts where the user was typing.
  const rangeRef = useRef(null);
  const [text, setText] = useState(String(value ?? ""));

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    box.innerHTML = toHtml(snapshotRef.current.text, infoRef.current);
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
    scratch.innerHTML = chipHtml(item.open, infoRef.current);
    fragment.appendChild(scratch.firstChild);
    if (item.close) {
      fragment.appendChild(range.extractContents());
      scratch.innerHTML = chipHtml(item.close, infoRef.current);
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
    box.innerHTML = toHtml(source, infoRef.current);
    placeCaretAtEnd(box);
    commit();
  };

  // "Fix tags": the target with the SOURCE's tags put back in the source's
  // order (see fixTags). An ordinary edit -- the reviewer checks it -- with Undo.
  const applyFix = () => {
    const box = boxRef.current;
    if (!box) return;
    const before = { html: snapshotRef.current.html, text: snapshotRef.current.text };
    box.innerHTML = toHtml(fixTags(source, toText(box)), infoRef.current);
    placeCaretAtEnd(box);
    commit();
    setUndoState(before);
  };

  const undoFix = () => {
    const box = boxRef.current;
    if (!box || !undoState) return;
    box.innerHTML = undoState.html;
    snapshotRef.current = { ...undoState };
    setText(undoState.text);
    setValue?.(undoState.text);
    placeCaretAtEnd(box);
    setUndoState(null);
  };

  const missing = missingTags(text, source);
  // What the save (server) and the export will demand: same tags, and for
  // SDLXLIFF the same order. Shown as soon as it is not met, not at save time.
  const issue = source ? tagIssue(source, text, { ordered }) : { ok: true };

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
      {source && !issue.ok && (
        <div className="tag-editor-issue" role="alert">
          <strong>Tags do not match the source:</strong> {describeTagIssue(issue)}.{" "}
          {issue.order ? "Expected order: " : "Source tags: "}
          <TagText text={(issue.order?.expected ?? tagSequenceList(source)).join("")} info={tagInfo} />
          <span className="tag-editor-issue-note">
            {" "}
            The segment cannot be approved, and the export will not write it, until they match.
          </span>
        </div>
      )}
      {source && (missing.length > 0 || tagSequence(text) !== tagSequence(source) || undoState) && (
        <div className="tag-editor-bar">
          {!issue.ok && (
            <Tooltip title="Puts the source's tags back in the source's order, placed by position in the sentence. Check where they landed.">
              <Button size="small" type="primary" onMouseDown={(e) => e.preventDefault()} onClick={applyFix}>
                Fix tags
              </Button>
            </Tooltip>
          )}
          {undoState && (
            <Button size="small" type="link" onMouseDown={(e) => e.preventDefault()} onClick={undoFix}>
              Undo fix
            </Button>
          )}
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
                    {chipLabel(item, tagInfo)}
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
