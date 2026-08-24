// Import-time visibility rules: decide which segments are not worth a
// reviewer's attention. A hidden segment (visible=false) is still stored in
// MySQL — the export reads ALL segments so the document reconstructs complete —
// but it is skipped by DAAIT/MTQE enrichment, by the editor listing and by
// the project statistics.
//
// Each rule is { id, test(text) }; `text` is the segment source with the
// inline-code placeholders removed. The first matching rule wins and its id is
// persisted in Tu.hiddenBy for traceability.

// Inline-code placeholders as exposed by modules/documents/xliff.js:
// <g1>…</g1>, <x2/>, <b1/>, <e1/>.
const INLINE_CODE_RE = /<\/?[gxbe]\d+\/?>/g;

// Whole segment is a single URL, optionally wrapped in quotes/brackets and
// with leading/trailing punctuation (bibliography footnotes, pasted links).
const URL_ONLY_RE =
  /^[\s"'“”«(\[<]*(?:https?:\/\/|www\.)\S+[\s"'“”»)\]>.,;:]*$/i;

const RULES = [
  {
    id: "url-only",
    test: (text) => URL_ONLY_RE.test(text),
  },
];

/**
 * Returns the id of the first rule that hides this segment, or null when the
 * segment stays visible.
 */
export function resolveHiddenBy(source) {
  const text = String(source ?? "").replace(INLINE_CODE_RE, "").trim();
  if (!text) return null;
  for (const rule of RULES) {
    if (rule.test(text)) return rule.id;
  }
  return null;
}
