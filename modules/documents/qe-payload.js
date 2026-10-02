import { tagIssue } from "./tag-check.js";

// What PECAT-E sends to the quality/LLM services (2026-10-02): source and
// target WITH their inline-tag placeholders (<g1>...</g1>, <x2/>), exactly as
// they travel to and come back from DAAIT /content/pecat. Until 2026-09-30
// they were stripped to plain text ("they skew the score", an assumption
// copied from revisions-pangeanic-local and never measured); now MTQE v2 and
// post_edit see the same strings the MT saw.

// {source, target} reference pairs for the QE calls, taken from a segment's
// tmInfo/glossaryInfo (both arrays of {source, target, ...}), as stored (with
// their placeholders). Capped so a segment with many fuzzy matches does not
// bloat the request.
export const toQeReferences = (info, cap = 2) =>
  (Array.isArray(info) ? info : [])
    .filter(
      (entry) =>
        typeof entry?.source === "string" && typeof entry?.target === "string",
    )
    .slice(0, cap)
    .map((entry) => ({ source: entry.source, target: entry.target }));

/**
 * Whether a post_edit suggestion keeps the source's tags (same tags, and the
 * same order for SDLXLIFF/XLIFF). A suggestion that loses, invents or reorders
 * tags is never shown nor stored: applying it would break the segment.
 */
export function suggestionKeepsTags(source, suggestion, { ordered = false } = {}) {
  return tagIssue(source, suggestion, { ordered }).ok;
}
