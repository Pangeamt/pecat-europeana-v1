"use client";
import { Avatar, Tooltip } from "antd";
import { X } from "lucide-react";

const COLORS = [
  "#f56a00",
  "#7265e6",
  "#ffbf00",
  "#00a2ae",
  "#1677ff",
  "#87d068",
];

function colorFor(seed) {
  if (!seed) return "#94a3b8";
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initialsFor(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "?";
}

/** A small round avatar (photo if the user has one, initials otherwise) with
 * a tooltip showing the full name — the canonical "who is this" chip.
 * Pass `onRemove` to show a tiny "x" badge on the corner that unassigns
 * without opening a reassignment flow. */
export default function UserAvatar({
  user,
  size = 28,
  onClick,
  onRemove,
  removeLabel,
}) {
  if (!user) return null;

  const avatar = (
    <Tooltip title={user.name || user.email}>
      <Avatar
        size={size}
        src={user.image || undefined}
        style={{
          backgroundColor: user.image ? undefined : colorFor(user.id || user.name),
          cursor: onClick ? "pointer" : undefined,
        }}
        onClick={onClick}
      >
        {!user.image ? initialsFor(user.name) : null}
      </Avatar>
    </Tooltip>
  );

  if (!onRemove) return avatar;

  return (
    <span className="relative inline-flex">
      {avatar}
      <Tooltip title={removeLabel}>
        <button
          type="button"
          aria-label={removeLabel}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full border border-white bg-rose-500 text-white shadow-sm transition-colors hover:bg-rose-600"
        >
          <X size={8} />
        </button>
      </Tooltip>
    </span>
  );
}
