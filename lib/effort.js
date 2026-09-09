// Effort model over the two QE scores. See README "Cálculo de esfuerzo".
//
// Per segment:
//   effortScore = min(QE v1, QE v2)        // the one present if the other is null
//   discrepant  = both present && |v1 - v2| >= DISAGREEMENT_THRESHOLD
//
// A segment is bucketed as:
//   - "disagree" (weight 1.0) when the two scorers disagree — a human must
//     look regardless of how good one of the scores is;
//   - otherwise the band its effortScore falls into;
//   - no score at all (both null) => "b50" (full effort, prudent default).
//
// Document effort:
//   weightedWords  = Σ (segment words × band weight)
//   effortIndex    = weightedWords / totalWords × 100
//   estimatedHours = weightedWords / throughputWph
//
// Words = whitespace-separated tokens of the SOURCE literal (same criterion
// as the stats strip). Weights, the disagreement threshold and the
// throughput can be overridden per project via Project.settings.effort:
//   { weights: { b95: 0.1, ... }, disagreement: 0.25, throughputWph: 800 }

export const DISAGREEMENT_THRESHOLD = 0.25;
export const DEFAULT_THROUGHPUT_WPH = 800;

export const EFFORT_BANDS = [
  { key: "b95", min: 0.95, weight: 0.1, label: "≥ 0.95", hint: "Quick read" },
  { key: "b85", min: 0.85, weight: 0.3, label: "0.85 – 0.94", hint: "Light review" },
  { key: "b75", min: 0.75, weight: 0.5, label: "0.75 – 0.84", hint: "Moderate review" },
  { key: "b50", min: 0.5, weight: 0.8, label: "0.50 – 0.74", hint: "Heavy post-editing" },
  { key: "b0", min: 0, weight: 1, label: "< 0.50", hint: "Translate from scratch" },
];

export const DISAGREE_BAND = {
  key: "disagree",
  weight: 1,
  label: "QE disagreement",
  hint: "v1 and v2 differ — review first",
};

export const wordCountOf = (tu) =>
  tu?.srcLiteral
    ? tu.srcLiteral.trim().split(/\s+/).filter(Boolean).length
    : 0;

export function effortScoreOf(tu) {
  const v1 =
    typeof tu?.translationScorePercent === "number"
      ? tu.translationScorePercent
      : null;
  const v2 = typeof tu?.mtqeV2Score === "number" ? tu.mtqeV2Score : null;
  if (v1 === null && v2 === null) return null;
  if (v1 === null) return v2;
  if (v2 === null) return v1;
  return Math.min(v1, v2);
}

export function isDisagreement(tu, threshold = DISAGREEMENT_THRESHOLD) {
  const v1 =
    typeof tu?.translationScorePercent === "number"
      ? tu.translationScorePercent
      : null;
  const v2 = typeof tu?.mtqeV2Score === "number" ? tu.mtqeV2Score : null;
  return v1 !== null && v2 !== null && Math.abs(v1 - v2) >= threshold;
}

// options: { weights?: {bandKey: number}, disagreement?: number,
//            throughputWph?: number } — e.g. Project.settings.effort.
export function computeEffort(tus, options = {}) {
  const weights = options.weights ?? {};
  const disagreementThreshold =
    typeof options.disagreement === "number"
      ? options.disagreement
      : DISAGREEMENT_THRESHOLD;
  const throughputWph =
    typeof options.throughputWph === "number" && options.throughputWph > 0
      ? options.throughputWph
      : DEFAULT_THROUGHPUT_WPH;

  const bandWeight = (band) =>
    typeof weights[band.key] === "number" ? weights[band.key] : band.weight;

  const bands = EFFORT_BANDS.map((band) => ({
    ...band,
    weight: bandWeight(band),
    count: 0,
    words: 0,
  }));
  const disagree = {
    ...DISAGREE_BAND,
    weight: bandWeight(DISAGREE_BAND),
    count: 0,
    words: 0,
  };

  let totalWords = 0;
  for (const tu of tus) {
    const words = wordCountOf(tu);
    totalWords += words;

    if (isDisagreement(tu, disagreementThreshold)) {
      disagree.count += 1;
      disagree.words += words;
      continue;
    }

    const score = effortScoreOf(tu);
    // Unscored segments count as full effort (b0): prudent worst case until
    // a score arrives.
    const band =
      score === null
        ? bands[bands.length - 1]
        : bands.find((candidate) => score >= candidate.min) ??
          bands[bands.length - 1];
    band.count += 1;
    band.words += words;
  }

  const weightedWords = Math.round(
    bands.reduce((sum, band) => sum + band.words * band.weight, 0) +
      disagree.words * disagree.weight,
  );
  const totalCount = tus.length;
  const effortIndex =
    totalWords > 0 ? Math.round((weightedWords / totalWords) * 100) : 0;
  const estimatedHours = weightedWords / throughputWph;

  return {
    bands,
    disagree,
    totalWords,
    totalCount,
    weightedWords,
    effortIndex,
    estimatedHours,
    throughputWph,
  };
}
