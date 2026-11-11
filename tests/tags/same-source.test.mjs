// Propagation of a confirm / reject (lib/same-source.js): only to segments
// whose source is IDENTICAL, character by character, or identical but for the
// numbers of its inline tags (then with the tags renumbered, if they pass the
// tag check). The MySQL column is utf8mb4_unicode_ci and matches more.
// node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  candidateFilter,
  isSameSource,
  keepExactSource,
  planPropagation,
  propagationKey,
  renumberTags,
  sourceShape,
} from "../../lib/same-source.js";
import { planBulkConfirm } from "../../lib/bulk-confirm.js";

const NBSP = " ";
const row = (id, srcLiteral, extra = {}) => ({ id, srcLiteral, translatedLiteral: `mt ${id}`, block: false, ...extra });
const ids = (plan) => plan.map((item) => item.row.id);

test("mismo origen solo si es idéntico carácter a carácter", () => {
  assert.equal(isSameSource("Software", "Software"), true);
  assert.equal(isSameSource("", ""), true);
  // Lo que la intercalación de MySQL da por igual y NO lo es:
  assert.equal(isSameSource("Software", "software"), false); // mayúsculas
  assert.equal(isSameSource("resume", "résumé"), false); // acentos
  assert.equal(isSameSource("Screen terms", `Screen${NBSP}terms`), false); // NBSP
  assert.equal(isSameSource("abc", "abc "), false); // espacio final
  assert.equal(isSameSource(null, null), false);
  assert.equal(isSameSource(undefined, "a"), false);
});

test("de lo que devuelve la BD solo quedan los de origen exacto (caso Leginda)", () => {
  const fromDb = [
    { id: "t455", srcLiteral: "Software" },
    { id: "t700", srcLiteral: "software" },
    { id: "t701", srcLiteral: "SOFTWARE" },
    { id: "t702", srcLiteral: `software${NBSP}` },
  ];
  assert.deepEqual(keepExactSource(fromDb, "software").map((r) => r.id), ["t700"]);
  assert.deepEqual(keepExactSource(fromDb, "Software").map((r) => r.id), ["t455"]);
  assert.deepEqual(keepExactSource(null, "software"), []);
});

test("forma del origen: los números de etiqueta por orden de aparición, el resto igual", () => {
  assert.equal(sourceShape("ne<g1182>o</g1182>s™ is indicated"), "ne<g1>o</g1>s™ is indicated");
  assert.equal(sourceShape("ne<g1226>o</g1226>s™ is indicated"), "ne<g1>o</g1>s™ is indicated");
  assert.equal(sourceShape("<x141/>10 min<x7/>"), "<x1/>10 min<x2/>");
  assert.equal(sourceShape("<b4/>a<e4/>"), "<b1/>a<e2/>");
  assert.equal(sourceShape("Software"), "Software");
  assert.equal(sourceShape(null), null);
  // Las mayúsculas y los acentos siguen contando:
  assert.notEqual(sourceShape("ne<g1>O</g1>s"), sourceShape("ne<g2>o</g2>s"));
  assert.equal(propagationKey("a<x3/>b"), propagationKey("a<x9/>b"));
});

test("renumerar: el texto escrito para un origen, con las etiquetas del otro", () => {
  const a = "ne<g1182>o</g1182>s™ is indicated to quantitatively measure:";
  const b = "ne<g1226>o</g1226>s™ is indicated to quantitatively measure:";
  assert.equal(
    renumberTags("ne<g1182>o</g1182>s™ este indicat pentru a măsura cantitativ:", a, b),
    "ne<g1226>o</g1226>s™ este indicat pentru a măsura cantitativ:",
  );
  // Varias etiquetas, también si la traducción las cambia de orden.
  assert.equal(renumberTags("<x2/>B <g1>A</g1>", "<g1>A</g1> B<x2/>", "<g5>A</g5> B<x9/>"), "<x9/>B <g5>A</g5>");
  // Una etiqueta que el origen no tiene: no se puede renumerar.
  assert.equal(renumberTags("A<x7/>", "A<x1/>", "A<x2/>"), null);
  assert.equal(renumberTags(null, "A<x1/>", "A<x2/>"), null);
});

test("propagar: idéntico con el mismo texto; misma forma con etiquetas renumeradas; lo demás no", () => {
  const tu = row("a", "ne<g1182>o</g1182>s™ is indicated");
  const candidates = [
    row("b", "ne<g1182>o</g1182>s™ is indicated"), // idéntico
    row("c", "ne<g1226>o</g1226>s™ is indicated"), // misma forma, otro número
    row("d", "ne<g7>O</g7>s™ is indicated"), // cambia una mayúscula
    row("e", "neos™ is indicated"), // sin etiqueta
    row("f", "n<g3>eo</g3>s™ is indicated"), // etiqueta en otro sitio
    row("g", "ne<g4>o</g4>s™ is indicated<x5/>"), // una etiqueta de más
    row("a", "ne<g1182>o</g1182>s™ is indicated"), // él mismo
  ];
  const plan = planPropagation(tu, "ne<g1182>o</g1182>s™ este indicat", candidates);
  assert.deepEqual(ids(plan), ["b", "c"]);
  assert.equal(plan[0].text, "ne<g1182>o</g1182>s™ este indicat");
  assert.equal(plan[1].text, "ne<g1226>o</g1226>s™ este indicat");
});

test("propagar: «Ale» no va a «A<x1/>le» ni a «Ale<x1/>» (ni al revés)", () => {
  const plain = row("a", "Ale");
  const mid = row("b", "A<x1/>le");
  const edge = row("c", "Ale<x1/>");
  assert.deepEqual(ids(planPropagation(plain, "Ale", [mid, edge])), []);
  assert.deepEqual(ids(planPropagation(mid, "A<x1/>le", [plain, edge])), []);
  assert.deepEqual(ids(planPropagation(edge, "Ale<x1/>", [plain, mid])), []);
});

test("propagar: el control de etiquetas del editor decide (orden en SDLXLIFF)", () => {
  const tu = row("a", "<g1>A</g1> B<x2/>");
  const twin = row("b", "<g5>A</g5> B<x9/>");
  const reordered = "<x2/>B <g1>A</g1>"; // la traducción cambia el orden
  // .sdlxliff (orden obligatorio): ese texto no valdría ni en el original; no se propaga.
  assert.deepEqual(ids(planPropagation(tu, reordered, [twin], { ordered: true })), []);
  // Otros formatos (sin orden): se propaga renumerado.
  const plan = planPropagation(tu, reordered, [twin], { ordered: false });
  assert.deepEqual(plan.map((item) => [item.row.id, item.text]), [["b", "<x9/>B <g5>A</g5>"]]);
  // Un texto con una etiqueta que el origen no tiene nunca se propaga a la gemela.
  assert.deepEqual(ids(planPropagation(tu, "<g1>A</g1> B<x2/><x3/>", [twin], { ordered: false })), []);
});

test("propagar sin texto (rechazar, o confirmar la MT tal cual): solo el estado, a idénticos y misma forma", () => {
  const tu = row("a", "Go <x1/>now");
  const plan = planPropagation(tu, undefined, [row("b", "Go <x1/>now"), row("c", "Go <x8/>now"), row("d", "go <x1/>now")]);
  assert.deepEqual(plan.map((item) => [item.row.id, item.text]), [["b", undefined], ["c", undefined]]);
  assert.deepEqual(ids(planPropagation(tu, "", [row("c", "Go <x8/>now")])), ["c"]);
});

test("prefiltro de la BD: sin etiquetas, el origen; con etiquetas, su trozo de texto más largo", () => {
  assert.deepEqual(candidateFilter("Software"), { srcLiteral: "Software" });
  assert.deepEqual(candidateFilter("ne<g1182>o</g1182>s™ is indicated"), { srcLiteral: { contains: "s™ is indicated" } });
  assert.deepEqual(candidateFilter("<x1/>"), { srcLiteral: "<x1/>" });
  assert.equal(candidateFilter(null), null);
});

test("confirmar todo: «Software» y «software» son dos trabajos, cada uno con su texto", () => {
  const rows = [row("a", "software"), row("b", "Software"), row("c", "software")];
  const { jobs, failed, covered } = planBulkConfirm(
    [{ tuId: "a", reviewLiteral: "software" }, { tuId: "b", reviewLiteral: "Software" }, { tuId: "c", reviewLiteral: "software" }],
    rows,
  );
  assert.deepEqual(failed, []);
  assert.deepEqual(jobs.map((job) => [job.tu.id, job.reviewLiteral]), [["a", "software"], ["b", "Software"]]);
  assert.deepEqual(covered.map((item) => item.tu.id), ["c"]); // repetición exacta de "a"
});

test("confirmar todo: la gemela con otros números de etiqueta la cubre la propagación", () => {
  const rows = [row("a", "ne<g1>o</g1>s"), row("b", "ne<g9>o</g9>s"), row("c", "Ne<g4>o</g4>s")];
  const { jobs, covered } = planBulkConfirm([{ tuId: "a" }, { tuId: "b" }, { tuId: "c" }], rows);
  assert.deepEqual(jobs.map((job) => job.tu.id), ["a", "c"]);
  assert.deepEqual(covered.map((item) => item.tu.id), ["b"]);
});
