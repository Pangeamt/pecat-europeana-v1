import locales from "../../lib/locales.json";
import { getLanguageCatalog } from "../../lib/daait";
import {
  catalogFromStatic,
  createCache,
  normalizeCatalog,
} from "../../lib/language-catalog";

// One cache per server process: DAAIT's catalog, refreshed at most once an hour
// (DAAIT_LANGUAGES_TTL_MS overrides). If DAAIT is unreachable the last copy is
// served; if there never was one, the old static list is.
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
    console.warn("[languages] DAAIT catalog unavailable, using the static list:", error.message);
    return { source: "static", stale: true, fetchedAt: null, languages: catalogFromStatic(locales) };
  }
}
