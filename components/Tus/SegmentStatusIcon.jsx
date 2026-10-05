"use client";

import {
  BadgeCheck,
  BadgeX,
  Check,
  CheckCheck,
  File,
  Pencil,
  X,
} from "lucide-react";

import {
  SEGMENT_STATE,
  SEGMENT_STATE_LABEL,
  segmentOrigin,
  segmentState,
} from "@/lib/segment-status";

// Status column of the segment grid, read the way Trados Studio's is: one icon
// for the confirmation level (blank sheet = not translated, blue pencil =
// draft, green pencil with a tick = translated...) and a badge for the origin
// of the target (AT, CM, 100%, 87%). Display only -- nothing here is clickable.
// The rules are in lib/segment-status.js.

const GREEN = "#4D7C0F";
const BLUE = "#2563EB";
const RED = "#DC2626";
const GREY = "#94A3B8";

// A pencil with a small mark at its corner: tick (translated) or cross (rejected).
const MarkedPencil = ({ color, Mark, markColor }) => (
  <span className="relative inline-block" style={{ width: 20, height: 18 }}>
    <Pencil size={16} color={color} />
    <Mark
      size={11}
      strokeWidth={3.5}
      color={markColor}
      className="absolute"
      style={{ right: -1, bottom: -2 }}
    />
  </span>
);

const ICONS = {
  [SEGMENT_STATE.NOT_TRANSLATED]: <File size={17} color={GREY} />,
  [SEGMENT_STATE.DRAFT]: <Pencil size={17} color={BLUE} />,
  [SEGMENT_STATE.TRANSLATED]: (
    <MarkedPencil color={GREEN} Mark={Check} markColor={GREEN} />
  ),
  [SEGMENT_STATE.TRANSLATION_REJECTED]: (
    <MarkedPencil color={RED} Mark={X} markColor={RED} />
  ),
  [SEGMENT_STATE.TRANSLATION_APPROVED]: <CheckCheck size={18} color={GREEN} />,
  [SEGMENT_STATE.SIGN_OFF_REJECTED]: <BadgeX size={18} color={RED} />,
  [SEGMENT_STATE.SIGNED_OFF]: <BadgeCheck size={18} color={GREEN} />,
};

const BADGE = {
  mt: { color: "#1D4ED8", fill: "rgba(37, 99, 235, 0.14)" },
  exact: { color: "#3F6212", fill: "rgba(77, 124, 15, 0.16)" },
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
            // Untouched = filled; edited = outline only (as in Trados).
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
