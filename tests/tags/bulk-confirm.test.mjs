// "Confirm all" as ONE list per request: what the server decides before
// saving (lib/bulk-confirm.js). node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BULK_CONFIRM_CHUNK,
  BULK_CONFIRM_MAX,
  chunksOf,
  mapWithLimit,
  planBulkConfirm,
} from "../../lib/bulk-confirm.js";

const row = (id, srcLiteral, extra = {}) => ({ id, srcLiteral, translatedLiteral: `mt ${id}`, block: false, ...extra });

test("la lista se parte en peticiones de muchos segmentos, en orden y sin perder ninguno", () => {
  const list = Array.from({ length: 1215 }, (_, index) => index);
  const chunks = chunksOf(list);
  assert.equal(chunks.length, Math.ceil(1215 / BULK_CONFIRM_CHUNK));
  assert.deepEqual(chunks.flat(), list);
  assert.ok(chunks.every((chunk) => chunk.length <= BULK_CONFIRM_MAX));
  assert.deepEqual(chunksOf([], 3), []);
  assert.deepEqual(chunksOf(null), []);
  assert.deepEqual(chunksOf([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});

test("plan: cada segmento se confirma con el texto enviado, o con el que ya tiene", () => {
  const rows = [row("a", "One"), row("b", "Two", { reviewLiteral: "borrador b" }), row("c", "Three")];
  const { jobs, failed } = planBulkConfirm(
    [{ tuId: "a", reviewLiteral: "tecleado a" }, { tuId: "b" }, { tuId: "c", reviewLiteral: null }],
    rows,
  );
  assert.deepEqual(failed, []);
  assert.deepEqual(jobs.map((job) => [job.tu.id, job.reviewLiteral]), [
    ["a", "tecleado a"],
    ["b", "borrador b"],
    ["c", "mt c"],
  ]);
});

test("plan: bloqueados, desconocidos y rechazados por etiquetas se informan y no paran al resto", () => {
  const rows = [row("a", "One"), row("b", "Two", { block: true }), row("c", "<x1/>Three"), row("d", "Four")];
  const refuse = (tu, text) =>
    tu.srcLiteral.includes("<x1/>") && !text.includes("<x1/>")
      ? { code: "INLINE_TAGS_MISMATCH", message: "tags" }
      : null;
  const { jobs, failed } = planBulkConfirm(
    [{ tuId: "a" }, { tuId: "b" }, { tuId: "c" }, { tuId: "zz" }, { tuId: "d" }],
    rows,
    refuse,
  );
  assert.deepEqual(jobs.map((job) => job.tu.id), ["a", "d"]);
  assert.deepEqual(failed.map((item) => [item.tuId, item.code]), [
    ["b", "SEGMENT_LOCKED"],
    ["c", "INLINE_TAGS_MISMATCH"],
    ["zz", "NOT_FOUND"],
  ]);
});

test("plan: dos segmentos con el mismo origen son UN trabajo (el primero se propaga al otro)", () => {
  const rows = [row("a", "Submit"), row("b", "Reset"), row("c", "Submit"), row("d", "Submit", { block: true })];
  const { jobs, failed } = planBulkConfirm([{ tuId: "a" }, { tuId: "b" }, { tuId: "c" }, { tuId: "a" }], rows);
  assert.deepEqual(jobs.map((job) => job.tu.id), ["a", "b"]);
  assert.deepEqual(failed, []);
});

test("plan: si el primero de un origen se rechaza, el siguiente con ese origen sí se confirma", () => {
  const rows = [row("a", "Submit"), row("c", "Submit")];
  const refuse = (tu) => (tu.id === "a" ? { code: "X", message: "no" } : null);
  const { jobs, failed } = planBulkConfirm([{ tuId: "a" }, { tuId: "c" }], rows, refuse);
  assert.deepEqual(jobs.map((job) => job.tu.id), ["c"]);
  assert.equal(failed.length, 1);
});

test("mapWithLimit: respeta el límite de simultáneos y el orden de los resultados", async () => {
  let running = 0;
  let peak = 0;
  const results = await mapWithLimit([5, 1, 4, 2, 3, 6, 0], 3, async (value) => {
    running += 1;
    peak = Math.max(peak, running);
    await new Promise((resolve) => setTimeout(resolve, value * 3));
    running -= 1;
    return value * 10;
  });
  assert.deepEqual(results, [50, 10, 40, 20, 30, 60, 0]);
  assert.equal(peak, 3);
  assert.deepEqual(await mapWithLimit([], 3, async () => 1), []);
});
