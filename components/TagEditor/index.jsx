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
import {
  CARET_ANCHOR,
  checkTagEdit,
  describeTagIssue,
  editorPieces,
  fixTags,
  missingTags,
  stillInTransit,
  stripCaretAnchors,
  tagIssue,
  tagList,
} from "./tag-rules";

// Target editor for segments with inline-code placeholders (<g1>…</g1>,
// <x2/>…), ported from revisions-pangeanic-local (static/js/editor.js): a
// contenteditable where every tag is an ATOMIC chip (contenteditable=false) —
// the caret cannot enter it and it cannot be deleted or duplicated. Since
// 2026-11-12 (as in Trados) a tag MOVES: drag it inside the target with the
// mouse, or cut it (Ctrl+X) and paste it where it goes (Ctrl+V).
// The rules (tag-rules.js) are checked on every input and a bad edit is
// reverted. Since 2026-09-30 the reference is the SOURCE (Trados model), not
// the value the editor opened with: an empty target or an MT that lost a tag
// used to freeze that broken sequence and the segment could never be saved.
// Missing source tags are inserted from the bar under the editor (click, or
// Ctrl+, for the next one; a paired tag wraps the selection) or with "Copy
// source". Quill cannot be used here: it parses the value as HTML and
// silently destroys unknown tags.
//
// Caret anchors (2026-10-05): chips side by side, or a chip at the start or
// end of the box, left no text position between them -- the reviewer could not
// click there nor get past them with the arrow keys. The box now keeps a
// zero-width space at those spots (see tag-rules.js); the caret is tracked in
// "units" (one per character, one per chip, anchors do not count), so it
// survives the DOM being tidied or restored.

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

/** Plain text with placeholders -> editor HTML with chips and caret anchors. */
function toHtml(text, info) {
  return editorPieces(text)
    .map((piece) =>
      piece.type === "tag"
        ? chipHtml(piece.raw, info)
        : piece.type === "anchor"
          ? CARET_ANCHOR
          : esc(piece.value),
    )
    .join("");
}

/**
 * The same as toHtml, as DOM nodes (2026-11-13): text stays a text node, so a
 * CR or CRLF survives (innerHTML would turn both into LF).
 */
function toFragment(text, info) {
  const fragment = document.createDocumentFragment();
  const holder = document.createElement("div");
  for (const piece of editorPieces(text)) {
    if (piece.type === "tag") {
      holder.innerHTML = chipHtml(piece.raw, info);
      fragment.appendChild(holder.firstChild);
    } else {
      fragment.appendChild(document.createTextNode(piece.type === "anchor" ? CARET_ANCHOR : piece.value));
    }
  }
  return fragment;
}

/** Editor DOM -> plain text with placeholders (chips serialize via data-raw). */
function toText(node) {
  let out = "";
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) out += stripCaretAnchors(child.nodeValue);
    else if (child.dataset && child.dataset.raw) out += child.dataset.raw;
    else if (child.tagName === "BR") out += "";
    else out += toText(child); // <mark> or other wrappers the browser adds
  }
  return out;
}

const isChip = (node) => Boolean(node?.dataset?.raw);
const isText = (node) => node?.nodeType === 3;
const visibleLength = (node) => stripCaretAnchors(node.nodeValue).length;

/**
 * Caret position in units from the start of the box: one per character, one
 * per chip; anchors do not count. null when the caret is not in the box.
 */
function caretUnits(box) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const { focusNode, focusOffset } = selection;
  if (!focusNode) return null;
  return unitsAt(box, focusNode, focusOffset);
}

/** Units (see caretUnits) before the position `node`/`offset` inside `box`; null outside it. */
function unitsAt(box, node, offset) {
  if (!box.contains(node)) return null;
  let units = 0;
  const children = [...box.childNodes];
  // Position between two children of the box (node is the box itself).
  const stop = node === box ? offset : children.indexOf(
    children.find((child) => child === node || child.contains(node)),
  );
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    if (index === stop) {
      if (node !== box && isText(child)) {
        units += stripCaretAnchors(child.nodeValue.slice(0, offset)).length;
      }
      return units;
    }
    units += unitOf(child);
  }
  return units;
}

const unitOf = (child) =>
  isText(child) ? visibleLength(child) : isChip(child) ? 1 : toText(child).length;

/** Units before a chip of the box. */
function unitsBefore(box, chip) {
  let units = 0;
  for (const child of box.childNodes) {
    if (child === chip) break;
    units += unitOf(child);
  }
  return units;
}

/** Text position under a screen point (caretPositionFromPoint, or caretRangeFromPoint in older Chromium). */
function pointPosition(x, y) {
  const position = document.caretPositionFromPoint?.(x, y);
  if (position) return { node: position.offsetNode, offset: position.offset };
  const range = document.caretRangeFromPoint?.(x, y);
  return range ? { node: range.startContainer, offset: range.startOffset } : null;
}

/**
 * Where a chip dropped at (x, y) lands, in units of the box; null when the
 * point is outside the target. Over another chip, before or after it by its
 * half, as a click.
 */
function dropUnits(box, x, y, dir) {
  const rect = box.getBoundingClientRect();
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
  const chip = document.elementFromPoint(x, y)?.closest?.("[data-raw]");
  if (chip && chip.parentNode === box) {
    const r = chip.getBoundingClientRect();
    const right = x > r.left + r.width / 2;
    return unitsBefore(box, chip) + ((dir === "rtl" ? !right : right) ? 1 : 0);
  }
  const position = pointPosition(x, y);
  return (position && unitsAt(box, position.node, position.offset)) ?? totalUnits(box);
}

/** MIME of the editor's own clipboard: the exact text, tags included. */
const CLIPBOARD_MIME = "application/x-pecat-segment";

/** Exact text (placeholders included) of the selection inside `box`, or null. */
function selectionRaw(box) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!box.contains(range.commonAncestorContainer)) return null;
  const holder = document.createElement("div");
  holder.appendChild(range.cloneContents());
  return toText(holder);
}

/** Puts the caret at `units` (see caretUnits), always inside a text node when there is one. */
function placeCaret(box, units) {
  let left = Math.max(0, units);
  const range = document.createRange();
  let placed = false;
  const children = [...box.childNodes];
  for (let index = 0; index < children.length && !placed; index += 1) {
    const child = children[index];
    if (isText(child)) {
      const length = visibleLength(child);
      if (left <= length) {
        // Raw offset after `left` visible characters (anchors skipped).
        let offset = 0;
        let seen = 0;
        while (offset < child.nodeValue.length && seen < left) {
          if (child.nodeValue[offset] !== CARET_ANCHOR) seen += 1;
          offset += 1;
        }
        // An anchor-only node: sit after the anchor, so typing follows it.
        if (length === 0) offset = child.nodeValue.length;
        range.setStart(child, offset);
        placed = true;
      } else {
        left -= length;
      }
    } else if (left === 0) {
      range.setStart(box, index);
      placed = true;
    } else {
      left -= isChip(child) ? 1 : toText(child).length;
    }
  }
  if (!placed) {
    range.selectNodeContents(box);
    range.collapse(false);
  } else {
    range.collapse(true);
  }
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

const totalUnits = (box) =>
  [...box.childNodes].reduce(
    (sum, child) =>
      sum + (isText(child) ? visibleLength(child) : isChip(child) ? 1 : toText(child).length),
    0,
  );

/**
 * Keeps one text position beside every chip: adds an anchor where a chip has
 * no text next to it and drops the anchors that text has made redundant.
 * Returns whether the DOM changed (the caller then restores the caret).
 */
function tidyAnchors(box) {
  let changed = false;
  for (const child of [...box.childNodes]) {
    if (!isText(child) || !child.nodeValue.includes(CARET_ANCHOR)) continue;
    const visible = stripCaretAnchors(child.nodeValue);
    const needed =
      visible === "" &&
      (isChip(child.previousSibling) || isChip(child.nextSibling)) &&
      !isText(child.previousSibling) &&
      !isText(child.nextSibling);
    if (visible !== "") {
      child.nodeValue = visible;
      changed = true;
    } else if (!needed) {
      child.remove();
      changed = true;
    } else if (child.nodeValue !== CARET_ANCHOR) {
      child.nodeValue = CARET_ANCHOR;
      changed = true;
    }
  }
  for (const chip of [...box.childNodes].filter(isChip)) {
    if (!isText(chip.previousSibling)) {
      chip.before(document.createTextNode(CARET_ANCHOR));
      changed = true;
    }
    if (!isText(chip.nextSibling)) {
      chip.after(document.createTextNode(CARET_ANCHOR));
      changed = true;
    }
  }
  return changed;
}

/**
 * What lies next to the caret in `step` direction (-1 left, +1 right), for the
 * keys the browser gets wrong around chips: "char" (ordinary text: leave it to
 * the browser), "chip" (with the chip node), or "edge" (an anchor or nothing).
 */
function besideCaret(box, step) {
  const selection = window.getSelection();
  const node = selection?.focusNode;
  if (!node || !box.contains(node)) return { kind: "edge" };
  let sibling;
  if (isText(node)) {
    let offset = selection.focusOffset;
    const value = node.nodeValue;
    while (step > 0 ? offset < value.length : offset > 0) {
      const char = value[step > 0 ? offset : offset - 1];
      if (char !== CARET_ANCHOR) return { kind: "char" };
      offset += step;
    }
    sibling = step > 0 ? node.nextSibling : node.previousSibling;
  } else {
    sibling = box.childNodes[step > 0 ? selection.focusOffset : selection.focusOffset - 1];
  }
  while (isText(sibling) && visibleLength(sibling) === 0) {
    sibling = step > 0 ? sibling.nextSibling : sibling.previousSibling;
  }
  if (isChip(sibling)) return { kind: "chip", chip: sibling };
  return isText(sibling) ? { kind: "char" } : { kind: "edge" };
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
  // SDLXLIFF/XLIFF: the source's tags in any order that still nests (no
  // crossed pairs; the export writes nothing else); others only need the set.
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
    // No scrolling here: the grid decides where the active segment sits.
    box.focus({ preventScroll: true });
    placeCaretAtEnd(box);
  }, []);

  // Caret in units (see caretUnits) at the last valid state: a rejected edit
  // puts it back there instead of at the end of the box.
  const caretRef = useRef(null);
  // An IME / dead-key composition is in progress: the DOM is not touched.
  const composingRef = useRef(false);
  // Moving tags (2026-11-12): the chip pressed (a click or the start of a
  // drag) and the source tags cut with Ctrl+X that are not pasted yet.
  const dragRef = useRef(null);
  const inTransitRef = useRef([]);

  const rememberRange = () => {
    const box = boxRef.current;
    const selection = window.getSelection();
    if (!box || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (box.contains(range.commonAncestorContainer)) {
      rangeRef.current = range.cloneRange();
      caretRef.current = caretUnits(box);
    }
  };

  // Re-creates the caret anchors after an edit, keeping the caret where it was.
  const tidy = () => {
    const box = boxRef.current;
    if (!box || composingRef.current) return;
    const units = caretUnits(box);
    if (tidyAnchors(box) && units !== null) placeCaret(box, units);
  };

  // Validates the editor's current content against the last valid state.
  const commit = () => {
    const box = boxRef.current;
    if (!box) return;
    const next = toText(box);
    // What was cut with Ctrl+X may be missing until it is pasted (moving a tag).
    const verdict = checkTagEdit(snapshotRef.current.text, next, source, inTransitRef.current);
    if (!verdict.ok) {
      box.innerHTML = snapshotRef.current.html;
      if (caretRef.current !== null) placeCaret(box, caretRef.current);
      else placeCaretAtEnd(box);
      inTransitRef.current = stillInTransit(inTransitRef.current, snapshotRef.current.text, source);
      message.error(`Formatting tags are protected: ${verdict.reason}`);
      return;
    }
    inTransitRef.current = stillInTransit(inTransitRef.current, next, source);
    tidy();
    snapshotRef.current = { html: box.innerHTML, text: next };
    setText(next);
    setValue?.(next);
  };

  const handleInput = () => {
    commit();
    rememberRange();
  };

  // Click on a chip: the caret goes to the side of the chip that was clicked
  // (a chip is not editable, so the browser would leave the caret where it was).
  const caretBesideChip = (box, chip, clientX) => {
    const rect = chip.getBoundingClientRect();
    const rightHalf = clientX > rect.left + rect.width / 2;
    const after = dir === "rtl" ? !rightHalf : rightHalf;
    placeCaret(box, unitsBefore(box, chip) + (after ? 1 : 0));
    rememberRange();
  };

  // Moves the chip to `target` (units counting the chip where it is). Outside
  // the target, or onto its own place, nothing moves.
  const moveChip = (box, chip, target) => {
    if (target === null || chip.parentNode !== box) return;
    const from = unitsBefore(box, chip);
    if (target === from || target === from + 1) {
      placeCaret(box, target);
      rememberRange();
      return;
    }
    chip.remove();
    placeCaret(box, target > from ? target - 1 : target);
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    selection.getRangeAt(0).insertNode(chip);
    const after = document.createRange();
    after.setStartAfter(chip);
    after.collapse(true);
    selection.removeAllRanges();
    selection.addRange(after);
    commit();
    rememberRange();
  };

  // Pressing a chip is a click (caret beside it) or, after moving 4 px, the
  // start of a drag that MOVES it, as in Trados: while dragging the caret shows
  // where it will land. Own drag on mouse events: the browser's native drag
  // inserts its own HTML when dropping into a contenteditable.
  const handleMouseDown = (event) => {
    const box = boxRef.current;
    const chip = event.target?.closest?.("[data-raw]");
    if (!box || !chip || chip.parentNode !== box) return;
    event.preventDefault();
    box.focus();
    if (event.button !== 0) {
      caretBesideChip(box, chip, event.clientX);
      return;
    }
    dragRef.current = { chip, x: event.clientX, y: event.clientY, moved: false };
    const move = (ev) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (!drag.moved && Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < 4) return;
      if (!drag.moved) {
        drag.moved = true;
        drag.chip.classList.add("tag-dragging");
        box.classList.add("tag-editor-dragging");
      }
      const units = dropUnits(box, ev.clientX, ev.clientY, dir);
      if (units !== null) placeCaret(box, units);
    };
    const up = (ev) => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      const drag = dragRef.current;
      dragRef.current = null;
      if (!drag) return;
      drag.chip.classList.remove("tag-dragging");
      box.classList.remove("tag-editor-dragging");
      if (!drag.moved) {
        caretBesideChip(box, drag.chip, drag.x);
        return;
      }
      moveChip(box, drag.chip, dropUnits(box, ev.clientX, ev.clientY, dir));
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
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
    inTransitRef.current = [];
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
    inTransitRef.current = [];
    box.innerHTML = toHtml(fixTags(source, toText(box)), infoRef.current);
    placeCaretAtEnd(box);
    commit();
    setUndoState(before);
  };

  const undoFix = () => {
    const box = boxRef.current;
    if (!box || !undoState) return;
    inTransitRef.current = [];
    box.innerHTML = undoState.html;
    snapshotRef.current = { ...undoState };
    setText(undoState.text);
    setValue?.(undoState.text);
    placeCaretAtEnd(box);
    setUndoState(null);
  };

  const missing = missingTags(text, source);
  // What the save (server) and the export will demand: same tags, and for
  // SDLXLIFF/XLIFF no crossed pairs. Shown as soon as it is not met.
  const issue = source ? tagIssue(source, text, { ordered }) : { ok: true };

  // Puts `raw` (placeholders as chips) at the caret, exactly: chips, NBSP and
  // line breaks as they are. checkTagEdit (commit) still refuses a duplicated
  // tag. Returns false when the caret is not in the box.
  const insertExact = (raw) => {
    const box = boxRef.current;
    const selection = window.getSelection();
    if (!box || !selection?.rangeCount || !box.contains(selection.getRangeAt(0).commonAncestorContainer)) return false;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const fragment = toFragment(raw, infoRef.current);
    const last = fragment.lastChild;
    range.insertNode(fragment);
    if (last) {
      const after = document.createRange();
      after.setStartAfter(last);
      after.collapse(true);
      selection.removeAllRanges();
      selection.addRange(after);
    }
    commit();
    // A break at the very end has no line to hold the caret: an anchor goes
    // after it (after commit, which would tidy it away; typing removes it and
    // the text lands on the new line). As in PECAT de Pangeanic 0.50.2.
    if (/[\r\n\u2028\u2029]$/.test(raw) && !last?.nextSibling) {
      const anchor = document.createTextNode(CARET_ANCHOR);
      const at = selection.getRangeAt(0);
      at.insertNode(anchor);
      const caret = document.createRange();
      caret.setStartAfter(anchor);
      caret.collapse(true);
      selection.removeAllRanges();
      selection.addRange(caret);
    }
    rememberRange();
    return true;
  };

  // Paste as plain text: HTML would bring duplicated chips (or foreign markup).
  // From this editor (2026-11-12, moving tags with Ctrl+X → Ctrl+V): the exact
  // text with its chips -- and, since 2026-11-13 (user decision), with its line
  // breaks: cutting and pasting a piece with a break used to turn it into a
  // space. Text from outside (Word, a web page) still comes in on one line.
  const handlePaste = (event) => {
    event.preventDefault();
    const clipboard = event.clipboardData || window.clipboardData;
    const exact = clipboard.getData(CLIPBOARD_MIME);
    if (exact && insertExact(exact)) return;
    const text = clipboard.getData("text").replace(/[\r\n]+/g, " ");
    document.execCommand("insertText", false, text);
  };

  // Ctrl+X: the exact text (tags included) goes to the clipboard and the cut
  // source tags stay "in transit" -- they may be missing until pasted where
  // they go. Meanwhile the missing-tags bar still offers them.
  const handleCut = (event) => {
    const box = boxRef.current;
    const raw = box ? selectionRaw(box) : null;
    if (raw === null) return;
    event.preventDefault();
    event.clipboardData.setData(CLIPBOARD_MIME, raw);
    event.clipboardData.setData("text/plain", raw.replace(/<\/?[a-z]\d+\/?>/gi, ""));
    inTransitRef.current = [...inTransitRef.current, ...tagList(raw)];
    document.execCommand("delete");
  };

  const handleKeyDown = (event) => {
    // Ctrl+, inserts the next missing source tag (as in Trados).
    if (event.key === "," && event.ctrlKey && missing.length) {
      event.preventDefault();
      insertTag(missing[0]);
      return;
    }
    // Shift+Enter: a line break, as in Trados and in the Quill editor of the
    // untagged segments (2026-11-13, user decision): the MT may drop a break
    // the source has, and the reviewer had no way to put it back. The F1 list
    // already offered it (softBreak), but this editor swallowed it.
    if (event.key === "Enter" && event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      insertExact("\n");
      return;
    }
    // A plain Enter does nothing (Ctrl+Enter & co. belong to the parent).
    if (event.key === "Enter" && !event.ctrlKey) {
      event.preventDefault();
      return;
    }
    const box = boxRef.current;
    const plain = !event.ctrlKey && !event.altKey && !event.metaKey;
    const collapsed = window.getSelection()?.isCollapsed;
    // Left / Right next to a chip: one press crosses the chip (and its
    // invisible anchor), landing on a real caret position. Ordinary text is
    // left to the browser.
    if (
      box &&
      plain &&
      !event.shiftKey &&
      collapsed &&
      (event.key === "ArrowLeft" || event.key === "ArrowRight")
    ) {
      const forward = (event.key === "ArrowRight") !== (dir === "rtl");
      const step = forward ? 1 : -1;
      if (besideCaret(box, step).kind !== "char") {
        event.preventDefault();
        const units = caretUnits(box);
        if (units !== null) {
          placeCaret(box, Math.min(totalUnits(box), Math.max(0, units + step)));
          rememberRange();
        }
        return;
      }
    }
    // Backspace / Delete next to a chip: a tag the source does not have can
    // be removed; a source tag stays (no error, the key just does nothing).
    if (
      box &&
      plain &&
      collapsed &&
      (event.key === "Backspace" || event.key === "Delete")
    ) {
      const beside = besideCaret(box, event.key === "Delete" ? 1 : -1);
      if (beside.kind !== "char") {
        event.preventDefault();
        if (beside.kind === "chip") {
          const units = caretUnits(box);
          const holder = document.createComment("");
          beside.chip.replaceWith(holder);
          const verdict = checkTagEdit(snapshotRef.current.text, toText(box), source);
          if (verdict.ok) {
            holder.remove();
            if (units !== null) {
              placeCaret(box, event.key === "Delete" ? units : units - 1);
            }
            commit();
            rememberRange();
          } else {
            holder.replaceWith(beside.chip);
          }
        }
        return;
      }
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
        onCut={handleCut}
        onKeyDown={handleKeyDown}
        onKeyUp={rememberRange}
        onMouseDown={handleMouseDown}
        onMouseUp={rememberRange}
        onCompositionStart={() => {
          composingRef.current = true;
        }}
        onCompositionEnd={() => {
          composingRef.current = false;
          tidy();
        }}
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
