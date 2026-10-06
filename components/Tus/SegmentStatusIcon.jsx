"use client";

import { Check, CircleCheck, Lock, Pencil, X } from "lucide-react";

import {
  SEGMENT_STATE,
  SEGMENT_STATE_LABEL,
  segmentOrigin,
  segmentState,
} from "@/lib/segment-status";

// Status column of the segment grid: one icon for the segment's situation
// (locked, not reviewed, confirmed, confirmed with changes, rejected) and,
// where it says something, a badge for the origin of the target (AT, 87%).
// Display only -- nothing here is clickable. The rules are in
// lib/segment-status.js; what the exported file says is the writer's business.

const GREEN = "#4D7C0F";
const BLUE = "#2563EB";
const RED = "#DC2626";
const GREY = "#64748B";
const AMBER = "#D97706";

// A pencil with a small mark at its corner: padlock (locked), tick (confirmed
// with changes) or cross (rejected).
const MarkedPencil = ({ color, Mark, markColor, markSize = 11 }) => (
  <span className="relative inline-block" style={{ width: 20, height: 18 }}>
    <Pencil size={16} color={color} />
    <Mark
      size={markSize}
      strokeWidth={3}
      color={markColor}
      className="absolute"
      style={{ right: -1, bottom: -2 }}
    />
  </span>
);

const ICONS = {
  [SEGMENT_STATE.LOCKED]: (
    <MarkedPencil color={GREY} Mark={Lock} markColor={AMBER} markSize={10} />
  ),
  [SEGMENT_STATE.PENDING]: <Pencil size={17} color={BLUE} />,
  [SEGMENT_STATE.CONFIRMED]: <CircleCheck size={18} color={GREEN} />,
  [SEGMENT_STATE.EDITED]: (
    <MarkedPencil color={GREEN} Mark={Check} markColor={GREEN} />
  ),
  [SEGMENT_STATE.REJECTED]: (
    <MarkedPencil color={RED} Mark={X} markColor={RED} />
  ),
};

const BADGE = {
  mt: { color: "#1D4ED8", fill: "rgba(37, 99, 235, 0.14)" },
  fuzzy: { color: "#B45309", fill: "rgba(217, 119, 6, 0.16)" },
};

export const segmentStatusLabel = (tu, options) => {
  const label = SEGMENT_STATE_LABEL[segmentState(tu, options)];
  const origin = segmentOrigin(tu, options);
  return origin ? `${label} · ${origin.text}${origin.edited ? " (edited)" : ""}` : label;
};

const SegmentStatusIcon = ({ tu, hasDraft = false }) => {
  const options = { hasDraft };
  const origin = segmentOrigin(tu, options);
  const badge = origin ? BADGE[origin.kind] : null;
  return (
    <span className="inline-flex items-center gap-1">
      {ICONS[segmentState(tu, options)]}
      {origin && (
        <span
          className="rounded px-1 text-[10px] font-semibold leading-4 tabular-nums"
          style={{
            color: badge.color,
            // Untouched = filled; edited = outline only.
            background: origin.edited ? "transparent" : badge.fill,
            border: `1px solid ${origin.edited ? badge.color : "transparent"}`,
          }}
        >
          {origin.text}
        </span>
      )}
    </span>
  );
};

export default SegmentStatusIcon;
