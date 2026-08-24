// Source of truth for the post-translation pipeline vocabulary added with the
// DAAIT migration. Everything is a plain string in MySQL (same pattern as
// Document.status) so new values need no schema migration.

// Tu.llmVerdict — outcome of the LLM review stage for one segment.
export const LLM_VERDICT = {
  OK: "OK", // the LLM saw nothing to change: auto-approved
  REVIEW: "REVIEW", // the LLM proposed changes: needs a human
};

// Tu.suggestionStatus — lifecycle of an applicable post-edit suggestion.
export const SUGGESTION_STATUS = {
  PENDING: "PENDING",
  APPLIED: "APPLIED",
  DISCARDED: "DISCARDED",
};

// Tu.blockReason — why a segment is locked (Tu.block stays the boolean gate).
export const BLOCK_REASON = {
  TM_MATCH: "TM_MATCH", // exact TM match auto-applied at translate time
  LLM_JUDGE: "LLM_JUDGE", // LLM review verdict OK auto-approved it
  INTERNAL: "INTERNAL", // locked in the source file (SDLXLIFF locked, etc.)
  MANUAL: "MANUAL", // a reviewer locked it by hand
};

// Per-document pipeline defaults, overridable per project via
// Project.settings (free-form JSON bag) and materialized on the Document row.
export const PIPELINE_DEFAULTS = {
  mtqeThreshold: 0.85,
  llmJudge: true,
  llmSuggest: true,
};

// MTQE score bands shared with the UI (see components/Tus).
export const MTQE_BANDS = {
  HIGH: 0.85, // >= HIGH: reliable, skips the LLM review
  MID: 0.65, // >= MID: doubtful; below: priority for review
};

export function resolvePipelineSettings(projectSettings = {}) {
  const raw = projectSettings ?? {};
  const threshold = Number(raw.mtqeThreshold);
  return {
    mtqeThreshold:
      Number.isFinite(threshold) && threshold >= 0 && threshold <= 1
        ? threshold
        : PIPELINE_DEFAULTS.mtqeThreshold,
    llmJudge: raw.llmJudge !== false,
    llmSuggest: raw.llmSuggest !== false,
  };
}

// Okapi/SDLXLIFF inline placeholders (<g1>…</g1>, <x2/>, <b1/>, <e1/>) must
// survive any machine rewrite. A suggestion that loses or invents tags is
// unusable — validate before storing it.
const INLINE_TAG_RE = /<\/?[a-z]+\d+\s*\/?>/gi;

export function extractInlineTags(text) {
  if (!text) return [];
  return (String(text).match(INLINE_TAG_RE) ?? []).map((tag) =>
    tag.replace(/\s+/g, ""),
  );
}

export function inlineTagsMatch(sourceText, candidateText) {
  const a = extractInlineTags(sourceText).sort();
  const b = extractInlineTags(candidateText).sort();
  if (a.length !== b.length) return false;
  return a.every((tag, i) => tag === b[i]);
}
