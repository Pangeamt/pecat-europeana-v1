import axios from "axios";
import crypto from "crypto";
const path = require("path");
// QE v2: mtqe-v2-api /score-with-references, SYNC and ONE segment per
// request (X-API-Key auth, 0-100 scores, xx-yy language tags, and inline
// tm/glossary references). MTQE_V2 is the full endpoint URL; unset disables
// the v2 pass.
const MTQE_V2_URL = process.env.MTQE_V2 || "";
const MTQE_V2_API_KEY = process.env.MTQE_V2_API_KEY || "";

export const isMtqeV2Configured = () => Boolean(MTQE_V2_URL);

// QE v2 wants xx-yy language tags ("en-us"); documents store bare primary
// tags ("en"). Map the common ones, duplicate the tag otherwise — the
// service only needs the primary part to pick its models.
const V2_REGION_BY_LANGUAGE = {
  en: "en-us",
  es: "es-es",
  fr: "fr-fr",
  de: "de-de",
  it: "it-it",
  pt: "pt-pt",
  nl: "nl-nl",
  ca: "ca-es",
};

const toV2LanguageTag = (language) => {
  const tag = String(language || "").toLowerCase();
  if (!tag) return tag;
  if (tag.includes("-")) return tag;
  return V2_REGION_BY_LANGUAGE[tag] || `${tag}-${tag}`;
};

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
// QE v2 scoring: ONE segment per request. `tm` and `glossary` are
// {source,target} reference lists (the segment's own matches). Returns the
// raw response ({ score: 0-100 | null, explanation, error, ... }); callers
// normalize the score to the 0-1 scale the UI bands expect.
export const postMTQEv2 = async ({
  source,
  target,
  tm = [],
  glossary = [],
  sourceLanguage,
  targetLanguage,
}) => {
  if (!isMtqeV2Configured()) {
    throw new Error("MTQE_V2 is not configured");
  }
  try {
    const response = await axios.post(
      MTQE_V2_URL.replace(/\/$/, ""),
      {
        // Source and target WITH their inline-tag placeholders, as they went
        // to / came back from DAAIT /content/pecat. Covers the batch job, the
        // rescore on confirm and the live draft evaluation.
        source,
        target,
        source_language: toV2LanguageTag(sourceLanguage),
        target_language: toV2LanguageTag(targetLanguage),
        ape: false,
        tm,
        glossary,
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...(MTQE_V2_API_KEY ? { "X-API-Key": MTQE_V2_API_KEY } : {}),
        },
        timeout: 120_000,
        maxBodyLength: Infinity,
      },
    );
    return response.data;
  } catch (error) {
    const detail = error.response?.data || error.message;
    throw new Error(
      `Error postMTQEv2: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`,
    );
  }
};
