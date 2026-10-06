"use client";

import { useState } from "react";
import { Popover, Spin } from "antd";
import { Redo2, Undo2 } from "lucide-react";

import { TagText, hasInlineTags } from "@/components/shared/inline-tags";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import {
  HISTORY_PREVIEW,
  REVISION_ACTION_LABEL,
  visibleRevisions,
} from "@/lib/tu-revision";
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

const Revision = ({ revision, info, t }) => {
  const textChanged = revision.textBefore !== revision.textAfter;
  const scoreChanged = revision.mtqeBefore !== revision.mtqeAfter;
  // An undo / redo is a change like any other, but it reads as what it was.
  const stepBack = revision.action === "undo" || revision.action === "restore";
  const stepForward = revision.action === "redo";
  const label = t(`tus.history.action.${revision.action}`);
  return (
    <li className="border-b border-slate-100 py-2 last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
        <span
          className={`inline-flex items-center gap-1 font-semibold ${
            stepBack || stepForward ? "text-amber-700" : "text-slate-800"
          }`}
        >
          {stepBack ? <Undo2 size={12} /> : null}
          {stepForward ? <Redo2 size={12} /> : null}
          {label.startsWith("tus.history.")
            ? (REVISION_ACTION_LABEL[revision.action] ?? revision.action)
            : label}
        </span>
        {revision.propagatedFromId && (
          <span className="text-slate-500">{t("tus.history.propagated")}</span>
        )}
        <span className="text-slate-500">
          {revision.byName || t("tus.history.unknown")} · {when(revision.createdAt)}
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
  const { t } = useTranslation();
  const [state, setState] = useState({ loading: false, revisions: null, error: false });
  // The newest 5 by default; "Show more" lists them all inside the same
  // scrolling box, so a long history never grows past the popover.
  const [expanded, setExpanded] = useState(false);

  const load = async (open) => {
    if (!open) {
      setExpanded(false);
      return;
    }
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
        <span className="text-xs text-red-600">{t("tus.history.loadError")}</span>
      ) : state.revisions === null ? (
        <Spin size="small" />
      ) : state.revisions.length === 0 ? (
        <span className="text-xs text-slate-500">{t("tus.history.empty")}</span>
      ) : (
        <>
          <ul className="m-0 list-none p-0">
            {visibleRevisions(state.revisions, expanded).map((revision) => (
              <Revision key={revision.id} revision={revision} info={tu.tagInfo} t={t} />
            ))}
          </ul>
          {state.revisions.length > HISTORY_PREVIEW ? (
            <button
              type="button"
              className="history-more mt-1 w-full cursor-pointer rounded border-0 bg-slate-50 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded
                ? t("tus.history.showLess")
                : t("tus.history.showMore", {
                    count: state.revisions.length - HISTORY_PREVIEW,
                  })}
            </button>
          ) : null}
        </>
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
