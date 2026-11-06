// Language tag the MTQE v2 service expects (pure module, no imports, so node:test
// loads it; lib/utils.js uses it).
//
// The service wants "xx-yy" ("en-us", "fr-fr"). Documents store whatever the
// file says: bare primary tags ("en"), hyphenated ("en-US") and, in the <file>
// of many .xlf/.xliff, UNDERSCORED ones ("en_GB", "fr_FR"). The underscore used
// to produce "en_gb-en_gb", which the service refuses (HTTP 400) -- every
// segment of the document failed and it was left without scores.
//
// A bare tag ("el") needs the code the service publishes in GET /languages.
// Duplicating it ("el-el") only works when that happens to exist: the service
// refuses "el-el", "sl-sl", "et-et", "ja-ja"... with HTTP 422 and the document
// is left without scores (2026-11-06, Greek documents in production). The
// table below follows the service's list (vsgpu02, 91 codes, read 2026-11-06):
// its only code for the language, the bare code when that is what it lists,
// and the generic one when it lists several (ar-001 "Arabic", zh-cn, sr-rs,
// sw-tz as CLDR's default region). Languages whose "xx-xx" the service has
// ("ro-ro", "ru-ru", "bg-bg"...) need no entry.
export const V2_REGION_BY_LANGUAGE = {
  en: "en-us",
  es: "es-es",
  fr: "fr-fr",
  de: "de-de",
  it: "it-it",
  pt: "pt-pt",
  nl: "nl-nl",
  ca: "ca-es",
  am: "am-et",
  ar: "ar-001",
  bn: "bn-bd",
  bs: "bs",
  cs: "cs-cz",
  cy: "cy",
  da: "da-dk",
  el: "el-gr",
  et: "et-ee",
  eu: "eu-es",
  fa: "fa-ir",
  fil: "fil-ph",
  ga: "ga",
  gl: "gl-es",
  gu: "gu-in",
  ha: "ha-ng",
  he: "he-il",
  hi: "hi-in",
  hy: "hy-am",
  ja: "ja-jp",
  ka: "ka-ge",
  kk: "kk",
  km: "km",
  kn: "kn-in",
  ko: "ko-kr",
  kr: "kr",
  ml: "ml-in",
  mn: "mn",
  mr: "mr-in",
  ms: "ms-my",
  mt: "mt",
  my: "my-mm",
  nb: "nb-no",
  nn: "nn-no",
  oc: "oc-fr",
  pa: "pa-in",
  qu: "qu-pe",
  sl: "sl-si",
  sq: "sq",
  sr: "sr-rs",
  sv: "sv-se",
  sw: "sw-tz",
  ta: "ta-in",
  te: "te-in",
  tg: "tg",
  tk: "tk",
  uk: "uk-ua",
  ur: "ur-pk",
  uz: "uz",
  vi: "vi-vn",
  zh: "zh-cn",
  zu: "zu-za",
};

/** "en_GB" -> "en-gb", "FR" -> "fr-fr", "el" -> "el-gr", "en-US" -> "en-us"; other bare tags are duplicated ("xx-xx"). */
export const toV2LanguageTag = (language) => {
  const tag = String(language || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
  if (!tag) return tag;
  if (tag.includes("-")) return tag;
  return V2_REGION_BY_LANGUAGE[tag] || `${tag}-${tag}`;
};
