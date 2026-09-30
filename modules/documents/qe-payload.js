import { visibleText } from "./sdlxliff/codes.js";

// What PECAT-E sends to the quality/LLM services (2026-09-30): the TEXT only.
//
// Segments carry their inline tags as placeholders (<g1>...</g1>, <x2/>) so
// the editor can protect them and the export can put the real codes back.
// Those placeholders mean nothing to MTQE (they skew the score) nor to the
// post_edit LLM (it rewrites or drops them), so every call to either strips
// them -- the same rule revisions-pangeanic-local applies (strip_tokens) on
// every MTQE/LLM call. Machine translation (/content/pecat) is the one
// exception: it NEEDS the placeholders to place the tags in the target.

/** Text without its inline-tag placeholders, spaces around removed tags collapsed. */
export function stripTags(text) {
  if (typeof text !== "string") return text;
  return visibleText(text).replace(/ {2,}/g, " ").trim();
}

/** True when the text carries inline-tag placeholders. */
export function hasTags(text) {
  return typeof text === "string" && visibleText(text) !== text;
}

// {source, target} reference pairs for the QE calls, taken from a segment's
// tmInfo/glossaryInfo (both arrays of {source, target, ...}). Capped so a
// segment with many fuzzy matches does not bloat the request. Tags stripped:
// TMs fed by older PECAT-E saves contain placeholders.
export const toQeReferences = (info, cap = 2) =>
  (Array.isArray(info) ? info : [])
    .filter(
      (entry) =>
        typeof entry?.source === "string" && typeof entry?.target === "string",
    )
    .slice(0, cap)
    .map((entry) => ({ source: stripTags(entry.source), target: stripTags(entry.target) }));

/** The source/target pair as MTQE and post_edit must receive it. */
export function qePair(source, target) {
  return { source: stripTags(source), target: stripTags(target) };
}
