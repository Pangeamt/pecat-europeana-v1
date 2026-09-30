// Effort model over the QE v2 score. See README "Cálculo de esfuerzo".
//
// Per segment:
//   effortScore = QE v2 score (mtqeV2Score, 0-1)
//
// A segment is bucketed in the band its effortScore falls into; no score
// at all => "b0" (full effort, prudent default).
//
// Document effort:
//   weightedWords  = Σ (segment words × band weight)
//   effortIndex    = weightedWords / totalWords × 100
//   estimatedHours = weightedWords / throughputWph
//
// Words = whitespace-separated tokens of the SOURCE literal (same criterion
// as the stats strip). Weights and the throughput can be overridden per
// project via Project.settings.effort:
//   { weights: { b95: 0.1, ... }, throughputWph: 800 }

export const DEFAULT_THROUGHPUT_WPH = 800;

export const EFFORT_BANDS = [
  { key: "b95", min: 0.95, weight: 0.1, label: "≥ 0.95", hint: "Quick read" },
  { key: "b85", min: 0.85, weight: 0.3, label: "0.85 – 0.94", hint: "Light review" },
  { key: "b75", min: 0.75, weight: 0.5, label: "0.75 – 0.84", hint: "Moderate review" },
  { key: "b50", min: 0.5, weight: 0.8, label: "0.50 – 0.74", hint: "Heavy post-editing" },
  { key: "b0", min: 0, weight: 1, label: "< 0.50", hint: "Translate from scratch" },
];

export const wordCountOf = (tu) =>
  tu?.srcLiteral
    ? tu.srcLiteral.trim().split(/\s+/).filter(Boolean).length
    : 0;

export function effortScoreOf(tu) {
  return typeof tu?.mtqeV2Score === "number" ? tu.mtqeV2Score : null;
}

// options: { weights?: {bandKey: number}, throughputWph?: number } — e.g.
// Project.settings.effort.
export function computeEffort(tus, options = {}) {
  const weights = options.weights ?? {};
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

  let totalWords = 0;
  for (const tu of tus) {
    const words = wordCountOf(tu);
    totalWords += words;

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
    bands.reduce((sum, band) => sum + band.words * band.weight, 0),
  );
  const totalCount = tus.length;
  const effortIndex =
    totalWords > 0 ? Math.round((weightedWords / totalWords) * 100) : 0;
  const estimatedHours = weightedWords / throughputWph;

  return {
    bands,
    totalWords,
    totalCount,
    weightedWords,
    effortIndex,
    estimatedHours,
    throughputWph,
  };
}
