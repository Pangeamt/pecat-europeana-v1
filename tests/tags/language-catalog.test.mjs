// Catalogo de idiomas de DAAIT con cache de 1 hora. node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  catalogFromSnapshot,
  createCache,
  normalizeCatalog,
  toCatalogTag,
} from "../../lib/language-catalog.js";
import snapshot from "../../lib/daait-languages.json" with { type: "json" };

const PAYLOAD = {
  count: 3,
  languages: [
    { tag: "fr-FR", name_en: "French (France)", name_i18n: { es: "Francés (Francia)" }, active: true },
    { tag: "am", name_en: "Amharic", name_i18n: { es: "Amárico" }, active: true },
    { tag: "xx", name_en: "Inactive", active: false },
  ],
};

test("catalogo: normaliza, ordena por nombre y descarta los inactivos", () => {
  const list = normalizeCatalog(PAYLOAD);
  assert.deepEqual(list.map((l) => l.code), ["am", "fr-FR"]);
  assert.equal(list[1].names.es, "Francés (Francia)");
  assert.deepEqual(normalizeCatalog(null), []);
  assert.deepEqual(normalizeCatalog({ languages: "x" }), []);
});

test("cache: una hora; dentro del plazo no vuelve a pedir, pasado el plazo si", async () => {
  let calls = 0;
  let clock = 1_000;
  const cache = createCache({ load: async () => ({ n: ++calls }), ttlMs: 3_600_000, now: () => clock });
  assert.equal((await cache.get()).data.n, 1);
  clock += 3_599_000;
  assert.equal((await cache.get()).data.n, 1, "aun vigente");
  clock += 2_000;
  const again = await cache.get();
  assert.equal(again.data.n, 2, "caducada: recarga");
  assert.equal(calls, 2);
});

test("cache: peticiones simultaneas comparten UNA carga", async () => {
  let calls = 0;
  const cache = createCache({ load: () => new Promise((r) => setTimeout(() => r({ n: ++calls }), 20)) });
  const [a, b, c] = await Promise.all([cache.get(), cache.get(), cache.get()]);
  assert.equal(calls, 1);
  assert.equal(a.data.n + b.data.n + c.data.n, 3);
});

test("cache: si DAAIT falla se sirve la ultima copia (stale); sin copia, el error sube", async () => {
  let fail = false;
  let clock = 0;
  const cache = createCache({
    load: async () => {
      if (fail) throw new Error("DAAIT caido");
      return ["ok"];
    },
    ttlMs: 1000,
    now: () => clock,
  });
  assert.deepEqual((await cache.get()).data, ["ok"]);
  fail = true;
  clock += 5000;
  const stale = await cache.get();
  assert.deepEqual(stale.data, ["ok"]);
  assert.equal(stale.stale, true);

  const cold = createCache({ load: async () => { throw new Error("nunca cargo"); } });
  await assert.rejects(() => cold.get(), /nunca cargo/);
});

// The 77 languages active in DAAIT 2.3.54 on 2026-10-02 (GET /language?active=true).
// If DAAIT's catalog changes: `npm run sync:daait-languages` and update this list.
const DAAIT_ACTIVE_2026_10_02 = (
  "am ar ar-AE bg bs ca ca-ES-valencia ca-IT cs cy da de de-DE de-IT el en en-GB en-US es " +
  "es-ES es-MX es-US et eu fa fi fil fr fr-CA fr-FR ga gl he hi hr hu id it it-IT ja ka kk km " +
  "ko kr lt lv mk mn mr mt nb nl pa pl pt-BR pt-PT ro ru sk sl sq sr sr-Latn-ME sv sw ta te tg " +
  "th tk tr uk uz vi zh zh-TW"
).split(" ");

test("respaldo: exactamente los idiomas activos de DAAIT, con sus codigos tal cual", () => {
  const codes = catalogFromSnapshot(snapshot).map((l) => l.code).sort();
  assert.deepEqual(codes, [...DAAIT_ACTIVE_2026_10_02].sort());
  assert.equal(snapshot.count, 77);
  assert.ok(codes.every((code) => !code.includes("_")), "ningun codigo con guion bajo");
});

test("respaldo: no ofrece idiomas de la lista vieja que DAAIT no tiene", () => {
  const codes = new Set(catalogFromSnapshot(snapshot).map((l) => l.code));
  for (const old of ["af", "af-ZA", "gu", "ar-IQ", "ak-GH", "aa-ET", "en-AU", "pt"]) {
    assert.ok(!codes.has(old), `${old} no esta activo en DAAIT`);
  }
});

test("catalogo: equivalents de DAAIT separados por espacios", () => {
  const [zh] = normalizeCatalog({ languages: [{ tag: "zh", name_en: "Chinese", equivalents: "zh-CN zh-Hans" }] });
  assert.deepEqual(zh.equivalents, ["zh-CN", "zh-Hans"]);
  assert.deepEqual(normalizeCatalog({ languages: [{ tag: "en-GB", equivalents: null }] })[0].equivalents, []);
});

test("toCatalogTag: un codigo de fuera pasa a ser el codigo de DAAIT", () => {
  const catalog = catalogFromSnapshot(snapshot);
  const cases = {
    "en-GB": "en-GB", // exacto
    "EN_us": "en-US", // mayusculas y guion bajo
    "am-ET": "am", // equivalente declarado por DAAIT
    "zh-CN": "zh", // equivalente: zh-CN es zh para DAAIT
    "zh-Hant": "zh-TW", // equivalente: DAAIT lista zh-Hant bajo zh-TW (tradicional), no bajo zh
    "es-AR": "es", // no listado: idioma principal
    "fr-CA": "fr-CA",
    "ca-ES-valencia": "ca-ES-valencia",
    "af-ZA": "af-ZA", // DAAIT no lo tiene: se deja tal cual, no se cambia de idioma
  };
  for (const [input, expected] of Object.entries(cases)) {
    assert.equal(toCatalogTag(input, catalog), expected, input);
  }
  assert.equal(toCatalogTag("", catalog), "");
  assert.equal(toCatalogTag(null, catalog), null);
});
