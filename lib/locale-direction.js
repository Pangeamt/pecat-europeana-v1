import locales from "@/lib/locales.json";

/**
 * Resolve the writing direction ("ltr" | "rtl") for a locale code.
 *
 * The direction is stored as the third element of each entry in
 * `lib/locales.json` (`["Display name", "Encoding", "ltr" | "rtl"]`).
 * Locale codes in the app use the underscore form (e.g. "es_ES", "ar").
 * Falls back to the base language subtag when the full code is unknown
 * (e.g. "ar_XX" -> "ar"), and defaults to "ltr".
 *
 * @param {string | null | undefined} localeCode
 * @returns {"ltr" | "rtl"}
 */
export function getTextDirection(localeCode) {
  if (!localeCode) return "ltr";

  const code = String(localeCode).replace(/-/g, "_");

  const entry = locales[code];
  if (entry && entry[2]) return entry[2];

  const base = code.split("_")[0];
  const baseEntry = locales[base];
  if (baseEntry && baseEntry[2]) return baseEntry[2];

  return "ltr";
}

/** True when the locale is written right-to-left. */
export function isRtl(localeCode) {
  return getTextDirection(localeCode) === "rtl";
}

/**
 * Resolve the human-readable display name for a locale code
 * (first element of each entry in `lib/locales.json`). Falls back to the
 * base language subtag, and finally to the raw code itself.
 *
 * @param {string | null | undefined} localeCode
 * @returns {string}
 */
export function getLocaleName(localeCode) {
  if (!localeCode) return "";

  const code = String(localeCode).replace(/-/g, "_");

  const entry = locales[code];
  if (entry && entry[0]) return entry[0];

  const base = code.split("_")[0];
  const baseEntry = locales[base];
  if (baseEntry && baseEntry[0]) return baseEntry[0];

  return localeCode;
}
