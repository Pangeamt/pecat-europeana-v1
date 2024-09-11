import crypto from "crypto";
import { func } from "joi";

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
