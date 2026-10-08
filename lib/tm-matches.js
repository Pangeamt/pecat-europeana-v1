// The memory matches of a segment as the TMs panel shows them (pure, no
// imports: node:test loads it).
//
// DAAIT returns every reference it retrieved, and the same pair often comes
// more than once with the same similarity: once from the memory it lives in
// and once more from the document's own working memory (or from a second
// memory holding the same pair). For the reviewer that is ONE match, so a
// repeated pair with the same value is shown -- and counted -- once. The same
// pair with a DIFFERENT value is kept: it is another piece of information.

const scoreOf = (match) => {
  const value = Number.parseFloat(String(match?.tm_score ?? ""));
  return Number.isFinite(value) ? value : -1;
};

/** The similarity as the panel prints it: two decimals, or a dash. */
export const tmScoreLabel = (match) => {
  const value = scoreOf(match);
  return value < 0 ? "—" : value.toFixed(2);
};

/** What makes two matches the same row: source, target and the value shown. */
export const tmMatchKey = (match) =>
  `${String(match?.source ?? "").trim()}\u0000${String(match?.target ?? "").trim()}\u0000${tmScoreLabel(match)}`;

/** The matches without the repeated ones (same pair, same value), best first. */
export function distinctTmMatches(tmInfo) {
  const seen = new Map();
  for (const match of Array.isArray(tmInfo) ? tmInfo : []) {
    if (!match || typeof match !== "object") continue;
    const key = tmMatchKey(match);
    if (!seen.has(key)) seen.set(key, match);
  }
  return [...seen.values()].sort((a, b) => scoreOf(b) - scoreOf(a));
}

/**
 * The exact memory match an import may LOCK a segment on, or null.
 *
 * DAAIT also searches the document's own working memory (`documentMemoryId`:
 * what this very document has produced so far). A hit there is a real
 * repetition only when the same source came EARLIER in the document
 * (`seenBefore`). Otherwise it is the echo of a previous attempt of the same
 * import -- a retry re-sends the texts under the same document id -- and
 * locking on it would accept a segment against itself.
 */
export function lockableExactMatch(tmInfo, { documentMemoryId = null, seenBefore = false } = {}) {
  for (const match of Array.isArray(tmInfo) ? tmInfo : []) {
    if (!match || match.tm_match !== true || match.tm_score !== 1) continue;
    const ownMemory = documentMemoryId != null && match.tm_id === documentMemoryId;
    if (ownMemory && !seenBefore) continue;
    return match;
  }
  return null;
}
