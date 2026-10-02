import snapshot from "../../lib/daait-languages.json";
import { getLanguageCatalog } from "../../lib/daait";
import {
  catalogFromSnapshot,
  createCache,
  normalizeCatalog,
  toCatalogTag,
} from "../../lib/language-catalog";

// One cache per server process: DAAIT's catalog, refreshed at most once an hour
// (DAAIT_LANGUAGES_TTL_MS overrides). If DAAIT is unreachable the last copy is
// served; if there never was one, the snapshot of DAAIT's active languages
// (lib/daait-languages.json) is — the same codes DAAIT would have returned.
const ttlMs = Number(process.env.DAAIT_LANGUAGES_TTL_MS);
const cache = createCache({
  load: async () => normalizeCatalog(await getLanguageCatalog()),
  ...(Number.isFinite(ttlMs) && ttlMs > 0 ? { ttlMs } : {}),
});

export async function listLanguagesService() {
  try {
    const { data, fetchedAt, stale } = await cache.get();
    if (data.length === 0) throw new Error("empty catalog");
    return { source: "daait", stale, fetchedAt, languages: data };
  } catch (error) {
    console.warn("[languages] DAAIT catalog unavailable, using the DAAIT snapshot:", error.message);
    return {
      source: "snapshot",
      stale: true,
      fetchedAt: snapshot.fetched_at ?? null,
      languages: catalogFromSnapshot(snapshot),
    };
  }
}

/**
 * The DAAIT catalog code for a language that did not come from the pickers
 * (an SDLXLIFF header): exact tag, else a DAAIT equivalent, else the primary
 * language. See `toCatalogTag`.
 */
export async function resolveDaaitLanguageTag(code) {
  if (!code) return code;
  const { languages } = await listLanguagesService();
  return toCatalogTag(code, languages);
}
