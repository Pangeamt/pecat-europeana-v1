import axios from "axios";
import crypto from "crypto";
import {
  MTQE_V2_ENDPOINTS,
  buildReferencesBody,
  buildScoreSegmentsBody,
  mtqeEndpoint,
  referencesUrl,
  runReferencesJob,
  scoreResults,
  scoreSegmentsUrl,
  toUnitScores,
} from "./mtqe-v2";
const path = require("path");
// QE v2: mtqe-v2-api, up to 50 segments per request (X-API-Key auth, 0-100
// scores, xx-yy language tags). MTQE_V2 is the service base and
// MTQE_V2_ENDPOINT picks the contract (see ./mtqe-v2.js): /score-segments with
// the document's memory/glossary ids (the default), or each segment's own
// references as text, synchronously (/score-with-references) or as an async
// job. MTQE_V2 unset disables the v2 pass.
const MTQE_V2_URL = scoreSegmentsUrl(process.env.MTQE_V2);
const MTQE_V2_API_KEY = process.env.MTQE_V2_API_KEY || "";
const MTQE_V2_ENDPOINT = mtqeEndpoint(process.env.MTQE_V2_ENDPOINT);

export const isMtqeV2Configured = () => Boolean(MTQE_V2_URL);

// MTQE v2 wants xx-yy language tags ("en-us"): see ./v2-language.js (it also
// fixes the underscored "en_GB" / "fr_FR" that .xlf files carry).

// Reference pairs for the QE calls, as stored: see modules/documents/qe-payload.js.
export { toQeReferences } from "../modules/documents/qe-payload";
// Formats the document service (module-pdocs, Okapi Tikal) can extract and
// rebuild, plus the locally-parsed sdlxliff.
export const ALLOWED_FILE_EXTENSIONS = [
  "pdf",
  "txt",
  "docx",
  "docm",
  "dotx",
  "dotm",
  "pptx",
  "pptm",
  "potx",
  "potm",
  "ppsx",
  "ppsm",
  "xlsx",
  "xlsm",
  "xltx",
  "xltm",
  "ods",
  "ots",
  "odt",
  "ott",
  "odp",
  "otp",
  "odg",
  "otg",
  "po",
  "idml",
  "sdlxliff",
  "xlf",
  "xliff",
];

// .sdlxliff / .xlf / .xliff: written back by splicing, no Tikal (see the module).
export { SPLICE_EXTENSIONS, isSpliceFormat, translatesEmptiesOnImport } from "./splice-formats";

export const EUROPEAN_LANGUAGES = {
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  sv: "Swedish",
  no: "Norwegian",
  da: "Danish",
  fi: "Finnish",
  is: "Icelandic",
  pl: "Polish",
  cs: "Czech",
  sk: "Slovak",
  sl: "Slovenian",
  hr: "Croatian",
  sr: "Serbian",
  mk: "Macedonian",
  bg: "Bulgarian",
  ro: "Romanian",
  hu: "Hungarian",
  el: "Greek",
  tr: "Turkish",
  et: "Estonian",
  lv: "Latvian",
  lt: "Lithuanian",
  mt: "Maltese",
  ga: "Irish",
  cy: "Welsh",
  eu: "Basque",
  gl: "Galician",
  ca: "Catalan",
  uk: "Ukrainian",
  ru: "Russian",
  be: "Belarusian",
  sq: "Albanian",
};

const ALLOWED_FILE_EXTENSIONS_SET = new Set(
  ALLOWED_FILE_EXTENSIONS.map((ext) => ext.toLowerCase()),
);

export const checkFile = (file) => {
  if (!file?.name) return false;

  const extension = file.name
    .slice(file.name.lastIndexOf(".") + 1)
    .toLowerCase();

  return ALLOWED_FILE_EXTENSIONS_SET.has(extension) ? extension : false;
};

export const generateSaltAndHash = ({ password }) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return { salt, hash };
};

export const validatePassword = ({ user, inputPassword }) => {
  const inputHash = crypto
    .pbkdf2Sync(inputPassword, user.salt, 1000, 64, "sha512")
    .toString("hex");
  const passwordsMatch = user.hash === inputHash;
  return passwordsMatch;
};

export function capitalize({ str }) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatDate(value) {
  const date = new Date(value);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Los meses en JavaScript son 0-indexados
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
// QE v2 scoring of 1..50 {source, target} segments in ONE request (see
// ./mtqe-v2.js for the contract). `tmIds` / `glossaryIds` are the document's
// DAAIT resources: the service fetches each segment's references from them.
// Returns one 0-1 score per segment, in order (null = that segment could not
// be scored). The service waits up to 300 s for a whole batch. Used through
// scoreMtqeV2 (below) when MTQE_V2_ENDPOINT is score-segments.
export const postMTQEv2Segments = async ({
  segments,
  sourceLanguage,
  targetLanguage,
  tmIds = [],
  glossaryIds = [],
  instructions = null,
  timeout = 330_000,
}) => {
  if (!isMtqeV2Configured()) {
    throw new Error("MTQE_V2 is not configured");
  }
  const body = buildScoreSegmentsBody({
    segments,
    sourceLanguage,
    targetLanguage,
    tmIds,
    glossaryIds,
    instructions,
  });
  try {
    const response = await axios.post(MTQE_V2_URL, body, {
      headers: {
        "Content-Type": "application/json",
        ...(MTQE_V2_API_KEY ? { "X-API-Key": MTQE_V2_API_KEY } : {}),
      },
      timeout,
      maxBodyLength: Infinity,
    });
    return toUnitScores(response.data, body.segments.length);
  } catch (error) {
    const detail = error.response?.data || error.message;
    throw new Error(
      `Error postMTQEv2Segments: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`,
    );
  }
};

// One HTTP call of the job flow may not outlast this, whatever the job's budget.
const MTQE_V2_JOB_CALL_TIMEOUT_MS = 60_000;

const mtqeJobHttp = (timeout) => {
  const options = {
    headers: {
      "Content-Type": "application/json",
      ...(MTQE_V2_API_KEY ? { "X-API-Key": MTQE_V2_API_KEY } : {}),
    },
    timeout: Math.min(timeout, MTQE_V2_JOB_CALL_TIMEOUT_MS),
    maxBodyLength: Infinity,
  };
  return {
    post: async (url, body) => (await axios.post(url, body, options)).data,
    get: async (url) => (await axios.get(url, options)).data,
  };
};

// QE v2 scoring of 1..50 segments, by the contract MTQE_V2_ENDPOINT picks.
// Each segment is { source, target, tmInfo, glossaryInfo }: the two lists are
// its stored references (what DAAIT returned for it) and travel as text in
// the two contracts with references; `tmIds` / `glossaryIds` only serve
// /score-segments, where the service looks the references up. `instructions`
// goes with all three.
// Returns one 0-1 score per segment, in order (null = not scored). Throws an
// error with `notStarted` when the service did not pick the job up at all.
// Covers the job after the import, the rescore on confirm and the live draft
// evaluation.
export const scoreMtqeV2 = async ({
  segments,
  sourceLanguage,
  targetLanguage,
  tmIds = [],
  glossaryIds = [],
  instructions = null,
  timeout = 330_000,
  pollMs,
}) => {
  if (MTQE_V2_ENDPOINT === MTQE_V2_ENDPOINTS.SEGMENTS) {
    return postMTQEv2Segments({
      segments,
      sourceLanguage,
      targetLanguage,
      tmIds,
      glossaryIds,
      instructions,
      timeout,
    });
  }
  if (!isMtqeV2Configured()) {
    throw new Error("MTQE_V2 is not configured");
  }
  const body = buildReferencesBody({
    segments,
    sourceLanguage,
    targetLanguage,
    instructions,
  });
  try {
    if (MTQE_V2_ENDPOINT === MTQE_V2_ENDPOINTS.REFERENCES) {
      // Synchronous: the scores come back with the request, inside `results`.
      const response = await axios.post(referencesUrl(process.env.MTQE_V2), body, {
        headers: {
          "Content-Type": "application/json",
          ...(MTQE_V2_API_KEY ? { "X-API-Key": MTQE_V2_API_KEY } : {}),
        },
        timeout,
        maxBodyLength: Infinity,
      });
      return toUnitScores(scoreResults(response.data), body.segments.length);
    }
    return await runReferencesJob({
      http: mtqeJobHttp(timeout),
      configured: process.env.MTQE_V2,
      body,
      timeoutMs: timeout,
      ...(pollMs ? { pollMs } : {}),
    });
  } catch (error) {
    const detail = error.response?.data || error.message;
    const wrapped = new Error(
      `Error scoreMtqeV2: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`,
    );
    wrapped.notStarted = Boolean(error.notStarted);
    throw wrapped;
  }
};
