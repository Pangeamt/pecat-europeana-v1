// Refreshes lib/daait-languages.json — the fallback language list — from
// DAAIT's catalog, keeping only its ACTIVE languages, so the list PECAT-E falls
// back to when DAAIT is down is exactly what DAAIT would have answered.
//
//   npm run sync:daait-languages                 # DAAIT_API_HOST or the production default
//   DAAIT_API_HOST=https://... npm run sync:daait-languages
//
// Needs network access to DAAIT (VPN for api-priv). Review the diff and commit.
import { writeFile } from "node:fs/promises";

const host = (process.env.DAAIT_API_HOST || "https://api-priv.pangeanic.com/service/autope2").replace(/\/$/, "");
const target = new URL("../lib/daait-languages.json", import.meta.url);
const KEEP = ["tag", "name_en", "name_i18n", "equivalents", "active"];

const response = await fetch(`${host}/language?active=true`);
if (!response.ok) throw new Error(`DAAIT answered HTTP ${response.status}`);
const payload = await response.json();
const languages = (payload.languages || [])
  .filter((entry) => entry && entry.tag && entry.active !== false)
  .map((entry) => Object.fromEntries(KEEP.map((key) => [key, entry[key] ?? null])))
  .sort((a, b) => a.tag.localeCompare(b.tag));
if (languages.length === 0) throw new Error("DAAIT returned no active languages; snapshot left untouched");

const version = await fetch(`${host}/openapi.json`)
  .then((r) => r.json())
  .then((spec) => spec?.info?.version)
  .catch(() => null);
const snapshot = {
  source: `DAAIT GET /service/autope2/language?active=true${version ? ` (${version})` : ""}`,
  fetched_at: new Date().toISOString().slice(0, 10),
  count: languages.length,
  languages,
};
await writeFile(target, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(`lib/daait-languages.json: ${languages.length} active DAAIT languages`);
