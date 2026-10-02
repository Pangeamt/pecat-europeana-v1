// DAAIT's language catalog, cached (pure module, no imports, so node:test loads it).
//
// PECAT-E used to carry its own static list (lib/locales.json, 519 locales with
// underscored codes: "en_GB"). DAAIT is the source of truth for which languages
// exist, so the language pickers now use ITS catalog (GET /language), loaded on
// demand and cached for one hour; when DAAIT is down they use a snapshot of the
// same catalog (lib/daait-languages.json), never the old list.

export const LANGUAGE_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * DAAIT's GET /language payload -> [{ code, name, names, equivalents }], sorted
 * by name. `code` is the catalog tag ("en-GB", "ar-AE"); `names` the
 * interface-locale names ({ es: "Árabe", ... }); `equivalents` the other tags
 * DAAIT treats as the same language (DAAIT sends them space-separated:
 * "zh-CN zh-Hans"). Inactive entries are dropped.
 */
export function normalizeCatalog(payload) {
  const list = Array.isArray(payload?.languages) ? payload.languages : [];
  return list
    .filter((entry) => entry && entry.tag && entry.active !== false)
    .map((entry) => ({
      code: entry.tag,
      name: entry.name_en || entry.tag,
      names: entry.name_i18n && typeof entry.name_i18n === "object" ? entry.name_i18n : {},
      equivalents:
        typeof entry.equivalents === "string" ? entry.equivalents.split(/\s+/).filter(Boolean) : [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The DAAIT catalog tag for a language code that came from outside the
 * pickers (an SDLXLIFF header, an old record): what PECAT-E sends to DAAIT has
 * to be one of DAAIT's own codes, as is.
 *
 * Tags are compared case-insensitively and with `_` read as `-` ("EN_us" is
 * "en-US"). In order: the tag itself ("en-US" -> "en-US"), a tag DAAIT lists as
 * an equivalent ("am-ET" -> "am", "zh-CN" -> "zh"), the primary language
 * ("es-AR" -> "es"). A code DAAIT does not know at all comes back unchanged
 * (hyphenated), so nothing is silently replaced by a different language.
 */
export function toCatalogTag(code, catalog) {
  if (!code) return code;
  const wanted = String(code).trim().replace(/_/g, "-");
  const key = wanted.toLowerCase();
  const entries = Array.isArray(catalog) ? catalog : [];
  const exact = entries.find((entry) => entry.code.toLowerCase() === key);
  if (exact) return exact.code;
  const equivalent = entries.find((entry) =>
    (entry.equivalents || []).some((tag) => tag.toLowerCase() === key),
  );
  if (equivalent) return equivalent.code;
  const primary = key.split("-")[0];
  const base = entries.find((entry) => entry.code.toLowerCase() === primary);
  return base ? base.code : wanted;
}

/**
 * A TTL cache with single-flight loading and stale-on-error: while a refresh is
 * running every caller shares it; if DAAIT is down the last good copy keeps
 * being served (flagged `stale`) instead of breaking the pickers.
 */
export function createCache({ load, ttlMs = LANGUAGE_CACHE_TTL_MS, now = Date.now }) {
  let value = null; // { data, fetchedAt }
  let inflight = null;

  const refresh = () => {
    if (!inflight) {
      inflight = Promise.resolve()
        .then(load)
        .then((data) => {
          value = { data, fetchedAt: now() };
          return { data, fetchedAt: value.fetchedAt, stale: false };
        })
        .catch((error) => {
          if (value) return { data: value.data, fetchedAt: value.fetchedAt, stale: true };
          throw error;
        })
        .finally(() => {
          inflight = null;
        });
    }
    return inflight;
  };

  return {
    async get() {
      if (value && now() - value.fetchedAt < ttlMs) {
        return { data: value.data, fetchedAt: value.fetchedAt, stale: false };
      }
      return refresh();
    },
    /** Drop the cached copy (tests, manual refresh). */
    clear() {
      value = null;
    },
  };
}

/**
 * The fallback catalog, used only if DAAIT cannot be reached and nothing is
 * cached: `lib/daait-languages.json`, a snapshot of DAAIT's ACTIVE languages
 * (`npm run sync:daait-languages` refreshes it). It goes through the same
 * normalisation as the live answer, so the pickers offer exactly DAAIT's codes
 * either way — never the old 519-locale list, most of which DAAIT does not have.
 */
export function catalogFromSnapshot(snapshot) {
  return normalizeCatalog(snapshot);
}
