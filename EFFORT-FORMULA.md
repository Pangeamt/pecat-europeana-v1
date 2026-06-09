# Translation Effort Formula

## Overview

The **Effort Index** measures the expected post-editing work for a set of translated segments, expressed as a percentage (0 = no effort, 100 = full translation from scratch).

It is calculated from the MTQE score (`translationScorePercent`) assigned to each Translation Unit (TU) by the MT Quality Estimation pipeline.

---

## Formula

```
E = Σ(W_i × α_i) / Σ(W_i) × 100
```

| Symbol | Description                                           |
| ------ | ----------------------------------------------------- |
| `W_i`  | Total source word count of all segments in bucket `i` |
| `α_i`  | Effort weight for bucket `i` (0 – 1)                  |
| `E`    | Effort Index (%)                                      |

**Word count** is computed by tokenising `srcLiteral` on whitespace:

```
words = srcLiteral.trim().split(/\s+/).filter(Boolean).length
```

---

## MTQE Buckets and Default Weights

| Bucket key | MTQE score range | Label       | Default weight `α` |
| ---------- | ---------------- | ----------- | ------------------ |
| `notMatch` | < 0.50           | No match    | **1.00**           |
| `mtqe50`   | 0.50 – 0.74      | Low QE      | **0.82**           |
| `mtqe75`   | 0.75 – 0.84      | Medium QE   | **0.62**           |
| `mtqe85`   | 0.85 – 0.94      | High QE     | **0.40**           |
| `mtqe95`   | 0.95 – 0.99      | Near exact  | **0.18**           |
| `mtqe100`  | 1.00             | Exact match | **0.02**           |

> `α = 1.00` means the translator must write the segment from scratch.
> `α = 0.02` means only a quick acceptance is expected (near-zero effort).

---

## Rationale

Using **word count** (rather than segment count) as the weight makes the index
proportional to the actual translation volume:

- A 50-word segment with no MT match contributes 50 × 1.00 = 50 effort units.
- A 2-word segment with a 98 % MTQE score contributes 2 × 0.18 = 0.36 effort units.

Dividing by total words normalises the result to a 0–100 % scale regardless of
project size.

---

## Parameterisation

The weights `α_i` are defined in `EFFORT_BUCKETS` inside
`components/Tus/statsTus.jsx`. To calibrate them for a specific workflow:

1. Collect post-editing time data per MTQE range (seconds/word).
2. Normalise each range by the "no match" rate:
   ```
   α_i = PE_time_i / PE_time_noMatch
   ```
3. Replace the `weight` field in each bucket entry.

**Example calibration** (hypothetical PE time in seconds/word):

| Bucket   | PE time (s/w) | Normalised α |
| -------- | ------------- | ------------ |
| No match | 60            | 1.00         |
| 50–74 %  | 49            | 0.82         |
| 75–84 %  | 37            | 0.62         |
| 85–94 %  | 24            | 0.40         |
| 95–99 %  | 11            | 0.18         |
| 100 %    | 1             | 0.02         |

---
