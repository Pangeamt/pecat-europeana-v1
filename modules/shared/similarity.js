import levenshtein from "fast-levenshtein";

export const DEFAULT_MIN_SIMILARITY = 0.5;

export const levenshteinSimilarity = (s1, s2) => {
  const source = String(s1 || "");
  const target = String(s2 || "");
  if (!source && !target) return 1;

  const distance = levenshtein.get(source.toLowerCase(), target.toLowerCase());
  const maxLength = Math.max(source.length, target.length);
  return maxLength === 0 ? 0 : (maxLength - distance) / maxLength;
};

export const jaccardSimilarity = (s1, s2) => {
  const wordsA = new Set(
    String(s1 || "")
      .toLowerCase()
      .split(" ")
      .filter(Boolean),
  );
  const wordsB = new Set(
    String(s2 || "")
      .toLowerCase()
      .split(" ")
      .filter(Boolean),
  );

  const union = new Set([...wordsA, ...wordsB]);
  if (union.size === 0) return 0;

  const intersection = new Set([...wordsA].filter((word) => wordsB.has(word)));
  return intersection.size / union.size;
};
