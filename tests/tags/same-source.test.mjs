// Propagation of a confirm / reject: only to segments whose source is
// IDENTICAL (lib/same-source.js). The MySQL column is utf8mb4_unicode_ci and
// matches more. node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { isSameSource, keepExactSource } from "../../lib/same-source.js";
import { planBulkConfirm } from "../../lib/bulk-confirm.js";

const NBSP = " ";

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

test("de lo que devuelve la BD solo se propaga a los de origen exacto (caso Leginda)", () => {
  // Lo que MySQL devuelve al buscar "software" en una lista de términos.
  const fromDb = [
    { id: "t455", srcLiteral: "Software" },
    { id: "t700", srcLiteral: "software" },
    { id: "t701", srcLiteral: "SOFTWARE" },
    { id: "t702", srcLiteral: `software${NBSP}` },
  ];
  assert.deepEqual(keepExactSource(fromDb, "software").map((row) => row.id), ["t700"]);
  assert.deepEqual(keepExactSource(fromDb, "Software").map((row) => row.id), ["t455"]);
  assert.deepEqual(keepExactSource(fromDb, "Inspection"), []);
  assert.deepEqual(keepExactSource(null, "software"), []);
  assert.deepEqual(keepExactSource([null, { id: "x" }], "software"), []);
});

test("confirmar todo: «Software» y «software» son dos trabajos, cada uno con su texto", () => {
  const row = (id, srcLiteral, mt) => ({ id, srcLiteral, translatedLiteral: mt, block: false });
  const rows = [row("a", "software", "software"), row("b", "Software", "Software"), row("c", "software", "software")];
  const { jobs, failed } = planBulkConfirm([{ tuId: "a" }, { tuId: "b" }, { tuId: "c" }], rows);
  assert.deepEqual(failed, []);
  // "c" es repetición exacta de "a" (lo cubre su propagación); "b" no lo es.
  assert.deepEqual(jobs.map((job) => [job.tu.id, job.reviewLiteral]), [
    ["a", "software"],
    ["b", "Software"],
  ]);
});
