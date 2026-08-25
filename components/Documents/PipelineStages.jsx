"use client";
import { Badge, Tooltip } from "antd";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { DOCUMENT_PENDING_STATUSES, DOCUMENT_STATUS } from "@/lib/document-status";

// Per-stage state of the post-translation pipeline (MT / MTQE / LLM) for a
// document row, derived from Document.status plus the pipelineStats telemetry
// written by modules/documents/pipeline-service.js (stage: SCORING -> SCORED
// -> REVIEWING -> DONE, plus mtqeError / llmError / llmSkipped).
//
// Rendered as a bare status dot per column — the column header names the
// stage, the dot color is the state (grey waiting, pulsing blue running,
// green done, red error, "—" not applicable) and the tooltip carries the
// exact state plus details (scored counts, auto-approvals, error messages).
const BADGE_STATUS = {
  waiting: "default",
  running: "processing",
  done: "success",
  error: "error",
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
        <Badge status={BADGE_STATUS[derived.state] ?? "default"} />
      )}
    </Tooltip>
  );
};

export default PipelineStageCell;
