import axios from "axios";
import crypto from "crypto";
const path = require("path");
const MTQE_HOST =
  process.env.MTQE || "https://api.pangeanic.com/service/mtqe/v1/score";
const MTQE_API_KEY = process.env.MTQE_API_KEY || "N.bh2*GPF4EieNrWe2Y@";
// QE v2 is a separate service (mtqe-v2-api): X-API-Key auth, 0-100 scores,
// sync batches capped at 20 segments. Unset MTQE_V2 disables the v2 pass.
const MTQE_V2_HOST = process.env.MTQE_V2 || "";
const MTQE_V2_API_KEY = process.env.MTQE_V2_API_KEY || "";
export const MTQE_V2_BATCH_SIZE = 20;

export const isMtqeV2Configured = () => Boolean(MTQE_V2_HOST);

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
];

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

// MTQE scoring service. Contract:
//   POST <MTQE_HOST> (default https://api.pangeanic.com/service/mtqe/v1/score)
//   body: { pairs: [{ source, target }], source_language, target_language }
//   auth: "p-api-key" header
//   response: { pairs: [{ score (0..1), source, target }] }
export const postMTQE = async ({ pairs, sourceLanguage, targetLanguage }) => {
  try {
    const response = await axios.post(
      MTQE_HOST,
      {
        pairs,
        source_language: sourceLanguage,
        target_language: targetLanguage,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "p-api-key": MTQE_API_KEY,
        },
        maxBodyLength: Infinity,
      },
    );
    return response.data;
  } catch (error) {
    const detail = error.response?.data || error.message;
    console.error("Error postMTQE:", detail);
    throw new Error(
      `Error postMTQE: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`,
    );
  }
};

// QE v2 scoring: POST {MTQE_V2}/score-segments with up to MTQE_V2_BATCH_SIZE
// segments. Returns results in request order; a per-segment `error` comes
// back with score null instead of failing the batch. Scores are 0-100 —
// callers normalize to 0-1 so v1 and v2 stay comparable.
export const postMTQEv2 = async ({ pairs, sourceLanguage, targetLanguage }) => {
  if (!isMtqeV2Configured()) {
    throw new Error("MTQE_V2 is not configured");
  }
  try {
    const response = await axios.post(
      `${MTQE_V2_HOST.replace(/\/$/, "")}/score-segments`,
      {
        segments: pairs.map((pair) => ({
          source: pair.source,
          target: pair.target,
        })),
        source_language: toV2LanguageTag(sourceLanguage),
        target_language: toV2LanguageTag(targetLanguage),
        ape: false,
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
