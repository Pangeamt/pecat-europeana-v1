// The TMs panel lists each memory match once (lib/tm-matches.js).
// node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { distinctTmMatches } from "../../lib/tm-matches.js";

const m = (source, target, tm_score, tm_id = "tm1") => ({ source, target, tm_score, tm_id, tm_item_id: `${tm_id}-${source}` });

test("la misma pareja devuelta por dos memorias cuenta una vez, con su mejor nota", () => {
  const shown = distinctTmMatches([
    m("Overview", "Aperçu", 0.34),
    m("and", "et  ", 0.32, "tmA"),
    m("and", "et", 0.33, "documento"),
    m("Risks", "Risques", 0.2, "tmA"),
    m("Risks", "Risques", 0.2, "documento"),
  ]);
  assert.deepEqual(shown.map((x) => [x.source, x.tm_score]), [["Overview", 0.34], ["and", 0.33], ["Risks", 0.2]]);
});

test("mismo origen con destino distinto son dos coincidencias", () => {
  assert.equal(distinctTmMatches([m("Submit", "Envoyer", 1), m("Submit", "Transmettre", 1)]).length, 2);
});

test("quedan ordenadas de mejor a peor, y nada raro con entradas vacías", () => {
  assert.deepEqual(distinctTmMatches([m("a", "b", 0.2), m("c", "d", 0.9), m("e", "f", "0.5")]).map((x) => x.source), ["c", "e", "a"]);
  assert.deepEqual(distinctTmMatches(null), []);
  assert.deepEqual(distinctTmMatches("x"), []);
  assert.deepEqual(distinctTmMatches([null, undefined, m("a", "b", null)]).length, 1);
});
