// MTQE v2 contract: POST <base>/score-segments (mtqe-v2-api 2.6.5). Pure
// module (only ./v2-language.js) so node:test loads it; lib/utils.js does the
// HTTP call with it.
//
//   request  { segments: [{ source, target }], source_language, target_language,
//              ape: false, tm_id?: [..], glossary_id?: [..], instructions?: ".." }
//   response [{ source, target, score: 0-100 | null, explanation, error, ... }]
//            one entry per segment, in the request's order.
//
// `ape` is REQUIRED by the service (422 without it); PECAT-E only scores, so it
// is always false. `tm_id` / `glossary_id` are DAAIT resource ids: the service
// looks the references up itself, per segment. `instructions` is the brief of
// the profile the document is processed with: the service gives it to DAAIT's
// post-edition and to its scoring prompt, so the translation is scored against
// what it was asked to do. A service older than that field ignores it.
import { toV2LanguageTag } from "./v2-language.js";

// The service refuses more than 50 segments per request.
export const MTQE_V2_MAX_SEGMENTS = 50;

const SCORE_SEGMENTS = "score-segments";
// Endpoints MTQE_V2 has pointed to in earlier releases; swapped for the
// current one so an old .env keeps working.
const KNOWN_ENDPOINTS = /\/(score-with-references|score-segments|score)$/;

/** MTQE_V2 (the service base, or the full URL of any scoring endpoint) -> the /score-segments URL. */
export const scoreSegmentsUrl = (configured) => {
  const base = String(configured || "")
    .trim()
    .replace(/\/+$/, "");
  if (!base) return "";
  return `${base.replace(KNOWN_ENDPOINTS, "")}/${SCORE_SEGMENTS}`;
};

/** Splits `items` into consecutive batches the service accepts (order kept). */
export const chunkSegments = (items, size = MTQE_V2_MAX_SEGMENTS) => {
  const list = Array.isArray(items) ? items : [];
  const chunks = [];
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size));
  }
  return chunks;
};

const cleanIds = (ids) => [
  ...new Set(
    (Array.isArray(ids) ? ids : [])
      .map((id) => String(id ?? "").trim())
      .filter(Boolean),
  ),
];

/** Request body for one /score-segments call (1..50 segments). */
export const buildScoreSegmentsBody = ({
  segments,
  sourceLanguage,
  targetLanguage,
  tmIds = [],
  glossaryIds = [],
  instructions = null,
}) => {
  const list = Array.isArray(segments) ? segments : [];
  if (list.length === 0 || list.length > MTQE_V2_MAX_SEGMENTS) {
    throw new Error(
      `MTQE v2 takes 1 to ${MTQE_V2_MAX_SEGMENTS} segments per request (got ${list.length})`,
    );
  }
  const tm = cleanIds(tmIds);
  const glossary = cleanIds(glossaryIds);
  const brief = typeof instructions === "string" ? instructions.trim() : "";
  return {
    // Source and target WITH their inline-tag placeholders, as they went to /
    // came back from DAAIT /content/pecat.
    segments: list.map(({ source, target }) => ({ source, target })),
    source_language: toV2LanguageTag(sourceLanguage),
    target_language: toV2LanguageTag(targetLanguage),
    ape: false,
    ...(tm.length > 0 ? { tm_id: tm } : {}),
    ...(glossary.length > 0 ? { glossary_id: glossary } : {}),
    // One text for the whole request; left out when the profile has none.
    ...(brief ? { instructions: brief } : {}),
  };
};

/**
 * The response as one 0-1 score per requested segment, in order; null where
 * the service could not score that segment ({ score: null, error }). Throws if
 * the response is not one entry per segment: scores would land on the wrong rows.
 */
export const toUnitScores = (results, expected) => {
  if (!Array.isArray(results) || results.length !== expected) {
    throw new Error(
      `MTQE v2 answered ${Array.isArray(results) ? results.length : "no"} results for ${expected} segments`,
    );
  }
  return results.map((result) =>
    typeof result?.score === "number" && Number.isFinite(result.score)
      ? result.score / 100
      : null,
  );
};
