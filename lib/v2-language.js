// Language tag the MTQE v2 service expects (pure module, no imports, so node:test
// loads it; lib/utils.js uses it).
//
// The service wants "xx-yy" ("en-us", "fr-fr"). Documents store whatever the
// file says: bare primary tags ("en"), hyphenated ("en-US") and, in the <file>
// of many .xlf/.xliff, UNDERSCORED ones ("en_GB", "fr_FR"). The underscore used
// to produce "en_gb-en_gb", which the service refuses (HTTP 400) -- every
// segment of the document failed and it was left without scores.
export const V2_REGION_BY_LANGUAGE = {
  en: "en-us",
  es: "es-es",
  fr: "fr-fr",
  de: "de-de",
  it: "it-it",
  pt: "pt-pt",
  nl: "nl-nl",
  ca: "ca-es",
};

/** "en_GB" -> "en-gb", "FR" -> "fr-fr", "en-US" -> "en-us"; unknown bare tags are duplicated ("xx-xx"). */
export const toV2LanguageTag = (language) => {
  const tag = String(language || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
  if (!tag) return tag;
  if (tag.includes("-")) return tag;
  return V2_REGION_BY_LANGUAGE[tag] || `${tag}-${tag}`;
};
