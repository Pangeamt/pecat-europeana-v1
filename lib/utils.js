import FormData from "form-data";
import axios from "axios";
import crypto from "crypto";
const path = require("path");
const MTQE_HOST =
  process.env.MTQE || "https://api.pangeanic.com/service/mtqe/v1/score";
const MTQE_API_KEY = process.env.MTQE_API_KEY || "N.bh2*GPF4EieNrWe2Y@";
const OXIGEN_APIKEY = "pcat-7d9a3f8e2b4c1d6f-default";

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
  "vsdx",
  "vsdm",
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
  "json",
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

export async function segmentTexts(lang, texts) {
  try {
    const SEGMENTED_TEXTS_HOST = process.env.SEGMENTED_TEXTS_HOST;
    const response = await fetch(`${SEGMENTED_TEXTS_HOST}/sbd`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lang,
        texts,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw new Error("Error segmentTexts");
  }
}

export async function translateTexts(src_lang, tgt_lang, texts) {
  try {
    const MT_TEXTS_HOST = process.env.MT_TEXTS_HOST;
    const response = await fetch(MT_TEXTS_HOST, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apikey: "",
        mode: "EUROPEANA",
        src: texts,
        src_lang,
        include_src: false,
        tgt_lang,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw new Error("Error Translate text");
  }
}

export const oxygenTranslateFile = async ({
  filePath,
  src_lang,
  tgt_lang,
  mt,
  tm_mode,
  tm_threshold,
  tm_ids,
  glossary_ids,
  userId,
  workspaceId,
}) => {
  if (typeof window === "undefined") {
    try {
      const fs = await import("fs");
      const OXIGEN_API_HOST = process.env.OXIGEN_API_HOST;
      const url = `${OXIGEN_API_HOST}/translate_file`;

      const form = new FormData();
      form.append("apikey", OXIGEN_APIKEY);
      form.append("src_lang", src_lang);
      form.append("tgt_lang", tgt_lang);
      form.append("return_json_for_humain_review", "true");
      form.append("engine_id", mt ? "-100000" : "0");
      form.append("tm_mode", tm_mode);
      form.append("tm_threshold", tm_threshold);

      form.append(
        "tm_ids",
        JSON.stringify(Array.isArray(tm_ids) ? tm_ids : []),
      );

      form.append(
        "glossary_ids",
        JSON.stringify(Array.isArray(glossary_ids) ? glossary_ids : []),
      );

      form.append("file", fs.createReadStream(filePath));

      const { data } = await axios.post(url, form, {
        headers: { ...form.getHeaders(), accept: "application/json" },
      });
      return data.trans_units;
    } catch (error) {
      console.error(
        "Error oxygenTranslateFile:",
        error.response ? error.response.data : error.message,
      );
    }
  } else {
    return [];
  }
};

export const oxygenBuildFile = async ({
  filePath,
  tgts,
  src_lang,
  tgt_lang,
}) => {
  if (typeof window === "undefined") {
    const fs = await import("fs");

    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error(`Source file not found: ${filePath || "(empty path)"}`);
    }

    try {
      const OXIGEN_API_HOST = process.env.OXIGEN_API_HOST;
      const url = `${OXIGEN_API_HOST}/translate_file`;

      const form = new FormData();
      form.append("apikey", OXIGEN_APIKEY);
      form.append("src_lang", src_lang);
      form.append("tgt_lang", tgt_lang);
      form.append("engine_id", "-100000");
      form.append("file", fs.createReadStream(filePath));
      form.append("reviewed_translations", JSON.stringify(tgts));

      const response = await axios.post(url, form, {
        headers: { ...form.getHeaders() },
        maxBodyLength: Infinity,
        responseType: "arraybuffer",
      });

      return response.data;
    } catch (error) {
      const detail = error.response?.data
        ? Buffer.isBuffer(error.response.data)
          ? error.response.data.toString("utf8")
          : error.response.data
        : error.message;
      console.error("Error oxygenBuildFile:", detail);
      throw new Error(`Error oxygenBuildFile: ${detail}`);
    }
  }

  return [];
};

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
