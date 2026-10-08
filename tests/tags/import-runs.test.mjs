// The import queue: which execution of a document's import counts, and which
// exact memory match is worth locking a segment on (lib/import-runs.js,
// lib/tm-matches.js). node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ImportSupersededError,
  beginImportRun,
  endImportRun,
  isCurrentImportRun,
  isImportRunning,
  markImportOrphaned,
  takeOrphanedImport,
} from "../../lib/import-runs.js";
import { lockableExactMatch } from "../../lib/tm-matches.js";

test("la última ejecución en empezar es la dueña del documento; la anterior deja de serlo", () => {
  const first = beginImportRun("doc-a");
  assert.equal(isCurrentImportRun("doc-a", first), true);
  // La cola relanza el trabajo mientras la primera sigue viva.
  const second = beginImportRun("doc-a");
  assert.notEqual(first, second);
  assert.equal(isCurrentImportRun("doc-a", first), false, "la antigua ya no debe escribir");
  assert.equal(isCurrentImportRun("doc-a", second), true);
  // La antigua termina (o falla): no borra el registro de la nueva.
  endImportRun("doc-a", first);
  assert.equal(isImportRunning("doc-a"), true);
  assert.equal(isCurrentImportRun("doc-a", second), true);
  endImportRun("doc-a", second);
  assert.equal(isImportRunning("doc-a"), false);
});

test("cada documento lleva su cuenta", () => {
  const a = beginImportRun("doc-b");
  const b = beginImportRun("doc-c");
  assert.equal(isCurrentImportRun("doc-b", a), true);
  assert.equal(isCurrentImportRun("doc-c", b), true);
  assert.equal(isCurrentImportRun("doc-b", b), false);
  endImportRun("doc-b", a);
  endImportRun("doc-c", b);
});

test("trabajo dado por «atascado» con la importación viva: no es un fallo todavía", () => {
  // Sin ejecución viva, el «atascado» es un fallo de verdad.
  assert.equal(markImportOrphaned("doc-d"), false);
  const run = beginImportRun("doc-d");
  assert.equal(markImportOrphaned("doc-d"), true, "sigue viva: no se marca como fallido");
  // Si esa ejecución acaba fallando, le toca a ella anotarlo (una sola vez).
  assert.equal(takeOrphanedImport("doc-d"), true);
  assert.equal(takeOrphanedImport("doc-d"), false);
  // Y si termina bien, no queda rastro.
  assert.equal(markImportOrphaned("doc-d"), true);
  endImportRun("doc-d", run);
  assert.equal(takeOrphanedImport("doc-d"), false);
  // Una ejecución nueva empieza limpia.
  const again = beginImportRun("doc-d");
  assert.equal(takeOrphanedImport("doc-d"), false);
  endImportRun("doc-d", again);
});

test("el error de ejecución relevada dice qué documento", () => {
  const error = new ImportSupersededError("doc-e");
  assert.equal(error.name, "ImportSupersededError");
  assert.match(error.message, /doc-e/);
  assert.ok(error instanceof Error);
});

const exact = (tm_id, extra = {}) => ({ tm_id, tm_match: true, tm_score: 1, source: "x", target: "y", ...extra });

test("coincidencia exacta de una memoria del perfil: se puede bloquear", () => {
  const match = lockableExactMatch([exact("tm-cliente")], { documentMemoryId: "doc-1", seenBefore: false });
  assert.equal(match?.tm_id, "tm-cliente");
});

test("eco de un intento anterior: la memoria del propio documento devuelve una frase que aún no había salido", () => {
  assert.equal(lockableExactMatch([exact("doc-1")], { documentMemoryId: "doc-1", seenBefore: false }), null);
  // Si además hay una memoria de verdad con la frase, esa sí vale.
  const match = lockableExactMatch([exact("doc-1"), exact("tm-cliente")], { documentMemoryId: "doc-1", seenBefore: false });
  assert.equal(match?.tm_id, "tm-cliente");
});

test("repetición de verdad: la frase ya salió antes en el documento", () => {
  const match = lockableExactMatch([exact("doc-1")], { documentMemoryId: "doc-1", seenBefore: true });
  assert.equal(match?.tm_id, "doc-1");
});

test("lo que no es exacto no bloquea nunca", () => {
  const opts = { documentMemoryId: "doc-1", seenBefore: true };
  assert.equal(lockableExactMatch([exact("tm", { tm_score: 0.99 })], opts), null);
  assert.equal(lockableExactMatch([exact("tm", { tm_match: false })], opts), null);
  assert.equal(lockableExactMatch([], opts), null);
  assert.equal(lockableExactMatch(null, opts), null);
  assert.equal(lockableExactMatch([null, undefined], opts), null);
  // Sin saber cuál es la memoria del documento, se comporta como antes.
  assert.equal(lockableExactMatch([exact("doc-1")])?.tm_id, "doc-1");
});
