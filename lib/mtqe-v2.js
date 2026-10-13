// MTQE v2 contracts. Pure module (only ./v2-language.js and ./tm-matches.js) so
// node:test loads it;
// lib/utils.js does the HTTP calls with it. MTQE_V2 is the service base and
// MTQE_V2_ENDPOINT picks one of three contracts:
//
// score-segments (the default; mtqe-v2-api 2.6.5) -- synchronous, the
// document's memories and glossaries travel as ids and the service looks the
// references up itself:
//   POST <base>/score-segments
//     { segments: [{ source, target }], source_language, target_language,
//       ape: false, tm_id?: [..], glossary_id?: [..], instructions?: ".." }
//     -> [{ source, target, score: 0-100 | null, ... }]
//
// score-with-references (service-mtqe 2.0) -- synchronous, every segment
// carries its OWN references as text:
//   POST <base>/score-with-references
//     { segments: [{ source, target, tm: [{ source, target, score? }], glossary: [..] }],
//       source_language, target_language, ape: false, daait_pre_translation: true,
//       translation_instructions?: ".." }
//     -> { request_id, chars, words, results: [{ source, target, score: 0-100 | null, ... }] }
//
// jobs/score-with-references (mtqe-v2-api 2.6.5) -- the same body, as an ASYNC job:
//   POST <base>/jobs/score-with-references          -> { job_id, status: "pending", ... }
//   GET  <base>/jobs/<job_id>                       until status is "done" (or "error")
//   GET  <base>/jobs/<job_id>/download?format=json  -> [{ source, target, score, ... }]
//
// All of them answer one entry per segment, in the request's order. The
// references sent as text are the segment's own, and EXACTLY the ones the
// editor shows for it: the memory matches of its TMs tab and the terms of its
// Glossaries tab, which are what DAAIT returned when it translated it
// (Tu.tmInfo / Tu.glossaryInfo). The score is judged against what the
// translation was given, and the reviewer sees what the judge saw. The brief
// of the profile the document is processed with travels as `instructions` in
// score-segments and as `translation_instructions` in the two contracts with
// references, where `daait_pre_translation: true` also says the translation
// being scored was made by DAAIT; a service that does not know those two
// fields ignores them. `ape` is always false: PECAT-E only scores.
import { distinctTmMatches } from "./tm-matches.js";
import { toV2LanguageTag } from "./v2-language.js";

// The service refuses more than 50 segments per request, job or not.
export const MTQE_V2_MAX_SEGMENTS = 50;
// References the service takes per segment and kind (422 beyond). DAAIT
// returns five at most, and documents imported before that fifteen: the limit
// is the service's, not a cut of ours.
export const MTQE_V2_MAX_REFERENCES = 20;
// A job nobody picks up is not slow, it is stuck (a worker that does not
// consume the service's `jobs` queue): given up on after this long in "pending".
export const MTQE_V2_JOB_START_TIMEOUT_MS = 120_000;

export const MTQE_V2_ENDPOINTS = {
  SEGMENTS: "score-segments",
  REFERENCES: "score-with-references",
  REFERENCES_JOB: "jobs/score-with-references",
};

/**
 * MTQE_V2_ENDPOINT -> the contract to use. Unset, or anything that is not one
 * of the three, means score-segments: the one every deployment has been
 * running, so nothing changes until an environment asks for another.
 */
export const mtqeEndpoint = (raw) => {
  const value = String(raw ?? "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();
  return Object.values(MTQE_V2_ENDPOINTS).includes(value)
    ? value
    : MTQE_V2_ENDPOINTS.SEGMENTS;
};

// Endpoints MTQE_V2 has pointed to in earlier releases; cut off so an old
// .env keeps working. The .env should carry the service base.
const KNOWN_ENDPOINTS =
  /\/(jobs\/score-with-references|jobs\/score-segments|score-with-references|score-segments|score)$/;

/** MTQE_V2 (the service base, or the full URL of any scoring endpoint) -> the service base. */
export const mtqeBaseUrl = (configured) => {
  const base = String(configured || "")
    .trim()
    .replace(/\/+$/, "");
  return base ? base.replace(KNOWN_ENDPOINTS, "") : "";
};

const endpointUrl = (configured, path) => {
  const base = mtqeBaseUrl(configured);
  return base ? `${base}/${path}` : "";
};

/** The /score-segments URL. */
export const scoreSegmentsUrl = (configured) =>
  endpointUrl(configured, MTQE_V2_ENDPOINTS.SEGMENTS);

/** The /score-with-references URL (synchronous, references as text). */
export const referencesUrl = (configured) =>
  endpointUrl(configured, MTQE_V2_ENDPOINTS.REFERENCES);

/** The /jobs/score-with-references URL. */
export const referencesJobUrl = (configured) =>
  endpointUrl(configured, MTQE_V2_ENDPOINTS.REFERENCES_JOB);

/** Where a job's status is polled. */
export const jobStatusUrl = (configured, jobId) =>
  endpointUrl(configured, `jobs/${encodeURIComponent(jobId)}`);

/** Where a finished job's results are fetched, as JSON. */
export const jobDownloadUrl = (configured, jobId) =>
  endpointUrl(configured, `jobs/${encodeURIComponent(jobId)}/download?format=json`);

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

const assertBatchSize = (list) => {
  if (list.length === 0 || list.length > MTQE_V2_MAX_SEGMENTS) {
    throw new Error(
      `MTQE v2 takes 1 to ${MTQE_V2_MAX_SEGMENTS} segments per request (got ${list.length})`,
    );
  }
};

const briefOf = (instructions) =>
  typeof instructions === "string" ? instructions.trim() : "";

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
  assertBatchSize(list);
  const tm = cleanIds(tmIds);
  const glossary = cleanIds(glossaryIds);
  const brief = briefOf(instructions);
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

const unitScore = (entry) => {
  const raw = entry?.tm_score ?? entry?.score;
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : null;
};

const isPair = (entry) =>
  typeof entry?.source === "string" &&
  typeof entry?.target === "string" &&
  Boolean(entry.source.trim()) &&
  Boolean(entry.target.trim());

// { source, target, score? } as the service takes it. `score` is the 0-1
// retrieval confidence and travels only when it is one: a glossary hit scored
// on another scale goes without it.
const toReference = (entry) => {
  const score = unitScore(entry);
  return { source: entry.source, target: entry.target, ...(score === null ? {} : { score }) };
};

/**
 * The memory matches of a segment as they travel: the rows of the editor's TMs
 * tab, the same list in the same order (distinctTmMatches: a repeated pair
 * with the same value once, best first). Nothing is picked or dropped here
 * beyond what the service cannot take: an entry without both texts, and
 * whatever passes its limit per segment.
 */
export const tmReferences = (tmInfo) =>
  distinctTmMatches(tmInfo).filter(isPair).slice(0, MTQE_V2_MAX_REFERENCES).map(toReference);

/**
 * The glossary terms of a segment as they travel: the rows of the editor's
 * Glossaries tab, which lists Tu.glossaryInfo as stored (components/Tus/list.jsx).
 */
export const glossaryReferences = (glossaryInfo) =>
  (Array.isArray(glossaryInfo) ? glossaryInfo : [])
    .filter(isPair)
    .slice(0, MTQE_V2_MAX_REFERENCES)
    .map(toReference);

/**
 * Request body with the references as text (1..50 segments), the same for the
 * synchronous /score-with-references and for the job. Every segment carries
 * its own `tm` / `glossary` -- an empty list too, which tells the service that
 * segment has none.
 */
export const buildReferencesBody = ({
  segments,
  sourceLanguage,
  targetLanguage,
  instructions = null,
}) => {
  const list = Array.isArray(segments) ? segments : [];
  assertBatchSize(list);
  const brief = briefOf(instructions);
  return {
    segments: list.map(({ source, target, tmInfo, glossaryInfo }) => ({
      source,
      target,
      tm: tmReferences(tmInfo),
      glossary: glossaryReferences(glossaryInfo),
    })),
    source_language: toV2LanguageTag(sourceLanguage),
    target_language: toV2LanguageTag(targetLanguage),
    ape: false,
    // The translation being scored was made by DAAIT: PECAT-E has no other
    // engine. Said outright so the service can tell (it does not use it yet).
    daait_pre_translation: true,
    // The profile's brief, under the name this contract gives it.
    ...(brief ? { translation_instructions: brief } : {}),
  };
};

/** The per-segment entries of a response: the list itself, or its `results` (service-mtqe 2.0). */
export const scoreResults = (data) => (Array.isArray(data) ? data : data?.results);

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

/** A job that did not give its scores. `notStarted`: the service never picked it up. */
export class MtqeJobError extends Error {
  constructor(message, { jobId = null, status = null, notStarted = false } = {}) {
    super(message);
    this.name = "MtqeJobError";
    this.jobId = jobId;
    this.status = status;
    this.notStarted = notStarted;
  }
}

const seconds = (ms) => Math.round(ms / 1000);

/**
 * Runs one job to the end: creates it, polls its status and reads its
 * results. Returns one 0-1 score per segment, in order (null = not scored).
 *
 * `http` is { post(url, body), get(url) }, each resolving to the parsed JSON.
 * The wait is bounded twice: `timeoutMs` for the whole job, and
 * `startTimeoutMs` for a job that stays "pending" -- that one is thrown as
 * `notStarted`, so the caller stops sending jobs to a service that is not
 * processing any instead of waiting for each of them.
 */
export async function runReferencesJob({
  http,
  configured,
  body,
  timeoutMs = 330_000,
  startTimeoutMs = MTQE_V2_JOB_START_TIMEOUT_MS,
  pollMs = 2_000,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = Date.now,
}) {
  const created = await http.post(referencesJobUrl(configured), body);
  const jobId = typeof created?.job_id === "string" ? created.job_id : "";
  if (!jobId) {
    throw new MtqeJobError("MTQE v2 did not return a job id");
  }
  const started = now();
  for (;;) {
    const info = await http.get(jobStatusUrl(configured, jobId));
    const status = String(info?.status ?? "");
    if (status === "done") break;
    if (status === "error") {
      throw new MtqeJobError(
        `MTQE v2 job ${jobId} failed: ${info?.error || "no reason given"}`,
        { jobId, status },
      );
    }
    const waited = now() - started;
    if (status === "pending" && waited >= startTimeoutMs) {
      throw new MtqeJobError(
        `MTQE v2 job ${jobId} was not picked up in ${seconds(startTimeoutMs)} s (still pending): the service is not processing jobs`,
        { jobId, status, notStarted: true },
      );
    }
    if (waited >= timeoutMs) {
      throw new MtqeJobError(
        `MTQE v2 job ${jobId} did not finish in ${seconds(timeoutMs)} s (${status || "no status"}, ${info?.processed ?? 0}/${info?.total ?? "?"})`,
        { jobId, status },
      );
    }
    await sleep(pollMs);
  }
  const results = await http.get(jobDownloadUrl(configured, jobId));
  return toUnitScores(results, body.segments.length);
}
