// The memory matches of a segment as the TMs panel shows them (pure, no
// imports: node:test loads it).
//
// DAAIT returns every reference it retrieved, and the same pair often comes
// more than once: once from the memory it lives in and once more from the
// document's own working memory (or from a second memory holding the same
// pair). For the reviewer that is ONE match, so it is shown once -- with its
// best score -- and the tab counts what the table lists.

const pairKey = (match) =>
  `${String(match?.source ?? "").trim()}\u0000${String(match?.target ?? "").trim()}`;

const scoreOf = (match) => {
  const value = Number.parseFloat(String(match?.tm_score ?? ""));
  return Number.isFinite(value) ? value : -1;
};

/** One entry per distinct source/target pair, best score kept, best first. */
export function distinctTmMatches(tmInfo) {
  const byPair = new Map();
  for (const match of Array.isArray(tmInfo) ? tmInfo : []) {
    if (!match || typeof match !== "object") continue;
    const key = pairKey(match);
    const kept = byPair.get(key);
    if (!kept || scoreOf(match) > scoreOf(kept)) byPair.set(key, match);
  }
  return [...byPair.values()].sort((a, b) => scoreOf(b) - scoreOf(a));
}
