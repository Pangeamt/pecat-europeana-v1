import axios from "axios";
import crypto from "crypto";
import {
  buildScoreSegmentsBody,
  scoreSegmentsUrl,
  toUnitScores,
} from "./mtqe-v2";
const path = require("path");
// QE v2: mtqe-v2-api /score-segments, up to 50 segments per request (X-API-Key
// auth, 0-100 scores, xx-yy language tags, references looked up by the service
// from tm_id/glossary_id). MTQE_V2 is the service URL (see ./mtqe-v2.js);
// unset disables the v2 pass.
const MTQE_V2_URL = scoreSegmentsUrl(process.env.MTQE_V2);
const MTQE_V2_API_KEY = process.env.MTQE_V2_API_KEY || "";

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
// be scored). Covers the batch job, the rescore on confirm and the live draft
// evaluation. The service waits up to 300 s for a whole batch.
export const postMTQEv2Segments = async ({
  segments,
  sourceLanguage,
  targetLanguage,
  tmIds = [],
  glossaryIds = [],
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
