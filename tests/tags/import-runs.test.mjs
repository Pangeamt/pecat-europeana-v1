// The import queue: which execution of a document's import counts
// (lib/import-runs.js). node --test "tests/**/*.test.mjs"
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
  waitForImportToEnd,
} from "../../lib/import-runs.js";

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

test("la ejecución relevada espera a que termine la nueva antes de devolver el trabajo a la cola", async () => {
  const first = beginImportRun("doc-w");
  const second = beginImportRun("doc-w");
  let released = false;
  const waiting = waitForImportToEnd("doc-w", { pollMs: 5 }).then(() => { released = true; });
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(released, false, "la nueva sigue viva: la antigua no sale");
  endImportRun("doc-w", first);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(released, false, "que acabe la antigua no cuenta");
  endImportRun("doc-w", second);
  await waiting;
  assert.equal(released, true);
  // Sin nadie importando, no espera nada; y nunca más del máximo.
  await waitForImportToEnd("doc-w", { pollMs: 5 });
  const stuck = beginImportRun("doc-w2");
  const started = Date.now();
  await waitForImportToEnd("doc-w2", { pollMs: 5, maxMs: 40 });
  assert.ok(Date.now() - started < 400);
  endImportRun("doc-w2", stuck);
});
