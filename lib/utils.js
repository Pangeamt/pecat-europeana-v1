import FormData from "form-data";
import axios from "axios";
import crypto from "crypto";
const path = require("path");
const MTQE_HOST = process.env.MTQE;

export const ALLOWED_FILE_EXTENSIONS = [
  // "pdf",
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
];

export const EUROPEAN_LANGUAGES = {
  en: "English",
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

export const checkFile = (file) => {
  if (!file?.name) return false;

  const extension = file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase();
  const allowedExtensions = ALLOWED_FILE_EXTENSIONS.map(ext => ext.toLowerCase());

  return allowedExtensions.includes(extension) ? extension : false;
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
    throw new Error("Error segmenting text");
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
    throw new Error("Error segmenting text");
  }
}

export const oxygenTranslateFile = async ( {filePath, src_lang, tgt_lang, mt }) => {
  if (typeof window === "undefined") {
    try {
      const fs = await import("fs");
      const OXIGEN_API_HOST = process.env.OXIGEN_API_HOST;
      const url = `${OXIGEN_API_HOST}/translate_file`

      const form = new FormData();
      form.append("apikey", "your_apikey");
      form.append("src_lang", src_lang);
      form.append("tgt_lang", tgt_lang);
      form.append("return_json_for_humain_review", "true");
      form.append("engine_id", mt ? "-10" : "0");
      form.append("file", fs.createReadStream(filePath));

      const { data } = await axios.post( url, form, { headers: { ...form.getHeaders(), accept: "application/json" } });
      return data.trans_units;
    } catch (error) {
      console.error( "Error:", error.response ? error.response.data : error.message );
    }
  } else {
    return [];
  }
};

export const oxygenBuildFile = async ({ filePath, tgts, src_lang, tgt_lang }) => {
  if (typeof window === "undefined") {
    try {
      const fs = await import("fs");
      const OXIGEN_API_HOST = process.env.OXIGEN_API_HOST;
      const url = `${OXIGEN_API_HOST}/translate_file`;

      const form = new FormData();
      form.append("apikey", "your_apikey");
      form.append("src_lang", src_lang);
      form.append("tgt_lang", tgt_lang);
      form.append("engine_id", "0");
      form.append("file", fs.createReadStream(filePath));
      form.append("reviewed_translations", JSON.stringify(tgts));

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: url,
        headers: { ...form.getHeaders()},
        data: form,
        responseType: "arraybuffer",
      };

      const response = await axios.request(config);

      return response.data;
    } catch (error) {
      return new Error(error);
    }
  } else {
    return [];
  }
};

export const postMTQE = async (pairs) => {
  try {
    const response = await axios.post(
      MTQE_HOST,
      pairs, 
      {
        headers: {"Content-Type": "application/json",},
        maxBodyLength: Infinity,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error segmenting text:", error.response?.data || error.message);
    throw new Error("Error segmenting text");
  }
};
