// The TMs panel lists a repeated memory match once (lib/tm-matches.js).
// node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { distinctTmMatches, tmMatchKey, tmScoreLabel } from "../../lib/tm-matches.js";

const m = (source, target, tm_score, tm_id = "tm1") => ({ source, target, tm_score, tm_id, tm_item_id: `${tm_id}-${source}` });

test("la misma pareja con el mismo valor, devuelta por dos memorias, cuenta una vez", () => {
  const shown = distinctTmMatches([
    m("Overview", "Aperçu", 0.34),
    m("and", "et  ", 0.3230128205128205, "tmA"),
    m("and", "et", 0.3230128205128205, "documento"),
    m("Risks", "Risques", 0.2010326, "tmA"),
    m("Risks", "Risques", 0.2010326, "documento"),
  ]);
  assert.deepEqual(shown.map((x) => [x.source, tmScoreLabel(x)]), [["Overview", "0.34"], ["and", "0.32"], ["Risks", "0.20"]]);
});

test("la misma pareja con valor DISTINTO se muestra las dos veces", () => {
  const shown = distinctTmMatches([m("Submit", "Envoyer", 1, "tmA"), m("Submit", "Envoyer", 0.85, "tmB")]);
  assert.deepEqual(shown.map(tmScoreLabel), ["1.00", "0.85"]);
});

test("mismo origen con destino distinto son dos coincidencias", () => {
  assert.equal(distinctTmMatches([m("Submit", "Envoyer", 1), m("Submit", "Transmettre", 1)]).length, 2);
});

test("valores que se ven iguales (dos decimales) cuentan como iguales", () => {
  assert.equal(distinctTmMatches([m("a", "b", 0.3231), m("a", "b", 0.3229)]).length, 1);
  assert.equal(distinctTmMatches([m("a", "b", 0.32), m("a", "b", 0.33)]).length, 2);
});

test("quedan de mejor a peor, con clave única por fila, y nada raro con entradas vacías", () => {
  const shown = distinctTmMatches([m("a", "b", 0.2), m("c", "d", 0.9), m("e", "f", "0.5"), m("c", "d", 0.4)]);
  assert.deepEqual(shown.map((x) => x.source), ["c", "e", "c", "a"]);
  assert.equal(new Set(shown.map(tmMatchKey)).size, shown.length);
  assert.deepEqual(distinctTmMatches(null), []);
  assert.deepEqual(distinctTmMatches("x"), []);
  assert.equal(distinctTmMatches([null, undefined, m("a", "b", null)]).length, 1);
  assert.equal(tmScoreLabel(m("a", "b", null)), "—");
});
