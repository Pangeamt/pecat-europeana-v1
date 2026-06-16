import en from "./locales/en.json";
import es from "./locales/es.json";

export const DEFAULT_LANGUAGE = "en";

export const SUPPORTED_LANGUAGES = ["en", "es"];

export const LANGUAGE_STORAGE_KEY = "pecat-language";

const dictionaries = { en, es };

export const isSupportedLanguage = (lang) =>
  typeof lang === "string" && SUPPORTED_LANGUAGES.includes(lang);

export const normalizeLanguage = (lang) =>
  isSupportedLanguage(lang) ? lang : DEFAULT_LANGUAGE;

export const getDictionary = (lang) =>
  dictionaries[normalizeLanguage(lang)] ?? dictionaries[DEFAULT_LANGUAGE];

/**
 * Resolve a dotted key (e.g. "nav.documents") against a dictionary, returning
 * the key itself when the path is missing so untranslated strings are visible.
 */
const resolvePath = (dictionary, key) =>
  key.split(".").reduce((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) return acc[part];
    return undefined;
  }, dictionary);

/**
 * Translate a key for the given language, interpolating `{token}` params.
 */
export const translate = (lang, key, params) => {
  if (!key) return "";
  const dictionary = getDictionary(lang);
  const value = resolvePath(dictionary, key);
  let text = typeof value === "string" ? value : key;

  if (params) {
    for (const [token, replacement] of Object.entries(params)) {
      text = text.replaceAll(`{${token}}`, String(replacement));
    }
  }

  return text;
};
