"use client";
import { Tooltip } from "antd";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { DOCUMENT_PENDING_STATUSES, DOCUMENT_STATUS } from "@/lib/document-status";

// Per-stage state of the post-translation pipeline (MT / MTQE / LLM) for a
// document row, derived from Document.status plus the pipelineStats telemetry
// written by modules/documents/pipeline-service.js (stage: SCORING -> SCORED
// -> REVIEWING -> DONE, plus mtqeError / llmError / llmSkipped).
//
// Rendered as a bare status dot per column — the column header names the
// stage, the dot color is the state (grey waiting, PULSING AMBER running,
// solid green done, red error, "—" not applicable) and the tooltip carries
// the exact state plus details (scored counts, auto-approvals, errors).
// Custom dots on purpose: antd's Badge "processing" takes the theme color
// (our brand green), so a running stage looked identical to a finished one.
const DOT_CLASS = {
  waiting: "bg-slate-300",
  done: "bg-emerald-500",
  error: "bg-red-500",
};

const StageDot = ({ state }) => {
  if (state === "running") {
    return (
      <span className="relative inline-flex size-2 align-middle">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
      </span>
    );
  }
  return (
    <span
      className={`inline-block size-2 rounded-full align-middle ${
        DOT_CLASS[state] ?? "bg-slate-300"
      }`}
    />
  );
};

export function deriveStages(doc) {
  const stats = doc?.pipelineStats ?? {};
  const stage = stats.stage ?? null;
  const pending = DOCUMENT_PENDING_STATUSES.includes(doc?.status);

  let mt;
  if (doc?.status === DOCUMENT_STATUS.FILE_ERROR) mt = { state: "error" };
  else if (pending && !stage) mt = { state: "running" };
  else if (doc?.mt === false && !stage) mt = { state: "off" };
  else mt = { state: "done" };

  let mtqe;
  if (stats.mtqeError) {
    mtqe = { state: "error", detail: stats.mtqeError };
  } else if (stage === "SCORING") {
    mtqe = { state: "running" };
  } else if (stage || doc?.status === DOCUMENT_STATUS.READY) {
    mtqe = {
      state: stage ? "done" : "off",
      detail:
        stats.mtqeScored != null ? `${stats.mtqeScored} scored` : undefined,
    };
  } else {
    mtqe = { state: "waiting" };
  }

  let llm;
  if (stats.llmSkipped) {
    llm = { state: "off", detail: stats.llmSkipped };
  } else if (stats.llmError) {
    llm = { state: "error", detail: stats.llmError };
  } else if (stage === "REVIEWING") {
    llm = { state: "running" };
  } else if (stage === "DONE") {
    const parts = [];
    if (stats.llmAutoApproved != null) {
      parts.push(`${stats.llmAutoApproved} auto-approved`);
    }
    if (stats.llmSuggested != null) {
      parts.push(`${stats.llmSuggested} suggestions`);
    }
    llm = { state: "done", detail: parts.join(", ") || undefined };
  } else if (stage === "SCORED" || stage === "SCORING") {
    llm = { state: "waiting" };
  } else {
    llm = { state: "off" };
  }

  return { mt, mtqe, llm };
}

const PipelineStageCell = ({ document, stage }) => {
  const { t } = useTranslation();
  const derived = deriveStages(document)[stage];
  if (!derived) return null;

  const title = `${t(`documents.pipeline.${derived.state}`)}${
    derived.detail ? ` — ${derived.detail}` : ""
  }`;

  return (
    <Tooltip title={title}>
      {derived.state === "off" ? (
        <span className="cursor-default text-slate-300">—</span>
      ) : (
        <StageDot state={derived.state} />
      )}
    </Tooltip>
  );
};

export default PipelineStageCell;
