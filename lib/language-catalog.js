// DAAIT's language catalog, cached (pure module, no imports, so node:test loads it).
//
// PECAT-E used to carry its own static list (lib/locales.json, 519 locales with
// underscored codes: "en_GB"). DAAIT is the source of truth for which languages
// exist, so the language pickers now use ITS catalog (GET /language), loaded on
// demand and cached for one hour.

export const LANGUAGE_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * DAAIT's GET /language payload -> [{ code, name, names }], sorted by name.
 * `code` is the catalog tag ("en-GB", "ar-AE"); `names` the interface-locale
 * names ({ es: "Árabe", ... }). Inactive entries are dropped.
 */
export function normalizeCatalog(payload) {
  const list = Array.isArray(payload?.languages) ? payload.languages : [];
  return list
    .filter((entry) => entry && entry.tag && entry.active !== false)
    .map((entry) => ({
      code: entry.tag,
      name: entry.name_en || entry.tag,
      names: entry.name_i18n && typeof entry.name_i18n === "object" ? entry.name_i18n : {},
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
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

/** The old static list as a catalog, used only if DAAIT cannot be reached and nothing is cached. */
export function catalogFromStatic(locales) {
  return Object.entries(locales)
    .map(([key, entry]) => ({
      code: key.replace(/_/g, "-"),
      name: entry[0],
      names: {},
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
