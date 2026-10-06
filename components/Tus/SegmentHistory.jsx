"use client";

import { useState } from "react";
import { Popover, Spin } from "antd";

import { TagText, hasInlineTags } from "@/components/shared/inline-tags";
import { REVISION_ACTION_LABEL } from "@/lib/tu-revision";
import {
  getTuRevisions,
  getTuRevisionsByShareToken,
} from "@/services/tus.services";

// Hover on the status icon of a segment: its edit history (who, when, what
// action, the text before -> after and the MTQE score before -> after). Loaded
// when the popover opens, not with the grid; re-read on every open, so it
// always shows the last save.

const score = (value) => (typeof value === "number" ? value.toFixed(2) : "—");

const when = (stamp) => {
  const moment = new Date(stamp);
  return `${moment.toLocaleDateString()} ${moment.toLocaleTimeString()}`;
};

const Text = ({ value, info }) =>
  value == null || value === "" ? (
    <span className="text-slate-400">(empty)</span>
  ) : hasInlineTags(value) ? (
    <TagText text={value} info={info} />
  ) : (
    value
  );

const Revision = ({ revision, info }) => {
  const textChanged = revision.textBefore !== revision.textAfter;
  const scoreChanged = revision.mtqeBefore !== revision.mtqeAfter;
  return (
    <li className="border-b border-slate-100 py-2 last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
        <span className="font-semibold text-slate-800">
          {REVISION_ACTION_LABEL[revision.action] ?? revision.action}
        </span>
        {revision.propagatedFromId && (
          <span className="text-slate-500">(same source as another segment)</span>
        )}
        <span className="text-slate-500">
          {revision.byName || "Unknown"} · {when(revision.createdAt)}
        </span>
        <span className="ml-auto tabular-nums text-slate-600">
          MTQE {scoreChanged ? `${score(revision.mtqeBefore)} → ` : ""}
          {score(revision.mtqeAfter)}
        </span>
      </div>
      {textChanged && (
        <div className="mt-1 text-xs leading-5">
          <div className="text-slate-500 line-through decoration-slate-300">
            <Text value={revision.textBefore} info={info} />
          </div>
          <div className="text-slate-900">
            <Text value={revision.textAfter} info={info} />
          </div>
        </div>
      )}
    </li>
  );
};

const SegmentHistory = ({ tu, shareToken, title, children }) => {
  const [state, setState] = useState({ loading: false, revisions: null, error: false });

  const load = async (open) => {
    if (!open) return;
    setState((prev) => ({ ...prev, loading: true, error: false }));
    try {
      const response = shareToken
        ? await getTuRevisionsByShareToken(shareToken, tu.id)
        : await getTuRevisions(tu.id);
      setState({ loading: false, revisions: response.data.revisions ?? [], error: false });
    } catch {
      setState({ loading: false, revisions: null, error: true });
    }
  };

  const content = (
    <div style={{ width: 460, maxHeight: 340, overflowY: "auto" }}>
      {state.error ? (
        <span className="text-xs text-red-600">Could not load the history</span>
      ) : state.revisions === null ? (
        <Spin size="small" />
      ) : state.revisions.length === 0 ? (
        <span className="text-xs text-slate-500">No edits recorded for this segment</span>
      ) : (
        <ul className="m-0 list-none p-0">
          {state.revisions.map((revision) => (
            <Revision key={revision.id} revision={revision} info={tu.tagInfo} />
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <Popover
      title={title}
      content={content}
      trigger="hover"
      placement="leftTop"
      mouseEnterDelay={0.35}
      onOpenChange={load}
    >
      {children}
    </Popover>
  );
};

export default SegmentHistory;
