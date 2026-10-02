// Catalogo de idiomas de DAAIT con cache de 1 hora. node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { catalogFromStatic, createCache, normalizeCatalog } from "../../lib/language-catalog.js";

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

test("catalogo estatico de respaldo: codigos con guion", () => {
  const list = catalogFromStatic({ en_GB: ["English (United Kingdom)", "UTF-8", "ltr"], af: ["Afrikaans", "UTF-8", "ltr"] });
  assert.deepEqual(list.map((l) => l.code), ["af", "en-GB"]);
});
