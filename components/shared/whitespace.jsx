"use client";

import React, { useEffect, useRef, useState } from "react";

import { WHITESPACE_KINDS, splitWhitespace } from "@/lib/whitespace";

// "Show spaces", as in Trados: · normal space, ° non-breaking space, and a
// mark of its own for the other kinds (lib/whitespace.js). The marks are
// DRAWN over the text, never written into it: the text keeps its characters,
// so copying, saving and the editors see exactly what was there.

/** Read-only text with every whitespace character marked. */
export function WhitespaceText({ text }) {
  return (
    <>
      {splitWhitespace(text).map((part, index) =>
        part.ws ? (
          <span
            key={index}
            className={`ws-mark ws-${part.ws.kind}`}
            data-mark={part.ws.mark}
            title={part.ws.name}
          >
            {part.text}
          </span>
        ) : (
          <React.Fragment key={index}>{part.text}</React.Fragment>
        ),
      )}
    </>
  );
}

const EDITABLE = ".ql-editor, .tag-editor";
const MAX_MARKS = 5000;

// Where each whitespace character of the editable box sits, relative to `host`.
function measureMarks(host) {
  const root = host.querySelector(EDITABLE);
  if (!root) return [];
  const base = host.getBoundingClientRect();
  const marks = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const value = node.nodeValue ?? "";
    for (let index = 0; index < value.length; index += 1) {
      const ws = WHITESPACE_KINDS[value[index]];
      if (!ws) continue;
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      const rect = range.getClientRects()[0] ?? range.getBoundingClientRect();
      if (!rect || rect.height === 0) continue;
      marks.push({
        ws,
        left: rect.left - base.left + rect.width / 2,
        top: rect.top - base.top,
        height: rect.height,
      });
      if (marks.length >= MAX_MARKS) return marks;
    }
  }
  return marks;
}

/**
 * Wraps a segment editor (Quill or TagEditor) and, when `enabled`, draws the
 * whitespace marks over its text. It only reads the editor's DOM: it never
 * touches its content, its selection or its events.
 */
export function WhitespaceOverlay({ enabled, children }) {
  const hostRef = useRef(null);
  const layerRef = useRef(null);
  const [marks, setMarks] = useState([]);

  useEffect(() => {
    const host = hostRef.current;
    // Off: nothing to measure (the marks are only drawn while enabled).
    if (!enabled || !host) return undefined;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setMarks(measureMarks(host)));
    };
    // The marks layer lives inside the host: its own changes are not a reason
    // to measure again (that would loop).
    const mutations = new MutationObserver((records) => {
      if (records.every((record) => layerRef.current?.contains(record.target))) return;
      measure();
    });
    mutations.observe(host, { subtree: true, childList: true, characterData: true });
    const resizes = new ResizeObserver(measure);
    resizes.observe(host);
    host.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      resizes.disconnect();
      host.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [enabled]);

  return (
    <div ref={hostRef} style={{ position: "relative" }}>
      {children}
      {enabled ? (
        <div ref={layerRef} aria-hidden="true">
          {marks.map((mark, index) => (
            <span
              key={index}
              className={`ws-overlay-mark ws-${mark.ws.kind}`}
              style={{
                left: mark.left,
                top: mark.top,
                height: mark.height,
                lineHeight: `${mark.height}px`,
              }}
            >
              {mark.ws.mark}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
