// Inline tags: what reaches MTQE/post_edit (text only) and the editor rules
// (Trados model: reference = source tags). node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { hasTags, qePair, stripTags, toQeReferences } from "../../modules/documents/qe-payload.js";
import { checkTagEdit, missingTags, tagsComplete } from "../../components/TagEditor/tag-rules.js";

const SRC = "Pulse <g1>aquí</g1> y <x2/> luego.";

test("MTQE/post_edit reciben SOLO el texto, sin marcadores", () => {
  assert.equal(stripTags(SRC), "Pulse aquí y luego.");
  assert.deepEqual(qePair(SRC, "Click <g1>here</g1> and <x2/> then."), {
    source: "Pulse aquí y luego.",
    target: "Click here and then.",
  });
  assert.equal(hasTags(SRC), true);
  assert.equal(hasTags("sin etiquetas"), false);
  assert.equal(stripTags("x < 5 y <total>"), "x < 5 y <total>", "texto con < > normal no se toca");
});

test("las referencias de TM/glosario tambien van sin marcadores", () => {
  const refs = toQeReferences([
    { source: "Pressure pipe <x1/> 1", target: "Tuyau <x1/> 1", tm_score: 1 },
    { source: "B", target: "b" },
    { source: "C", target: "c" },
  ]);
  assert.deepEqual(refs, [
    { source: "Pressure pipe 1", target: "Tuyau 1" },
    { source: "B", target: "b" },
  ]);
});

test("editor: no se puede borrar una etiqueta del origen que ya estaba", () => {
  const r = checkTagEdit("Click <g1>here</g1> and <x2/>", "Click <g1>here</g1> and", SRC);
  assert.equal(r.ok, false);
  assert.match(r.reason, /<x2\/> is a source tag and cannot be deleted/);
});

test("editor: ni duplicar ni meter etiquetas ajenas al origen", () => {
  assert.equal(checkTagEdit("a <x2/>", "a <x2/><x2/>", SRC).ok, false);
  assert.match(checkTagEdit("a", "a <x9/>", SRC).reason, /not a tag of the source/);
});

test("editor: se pueden INSERTAR las que faltan y QUITAR las inventadas por la MT", () => {
  assert.equal(checkTagEdit("Click here", "Click <x2/> here", SRC).ok, true, "insertar una del origen");
  assert.equal(checkTagEdit("Click <x7/> here", "Click here", SRC).ok, true, "quitar la inventada");
});

test("editor: etiquetas que faltan, agrupando las parejas, en orden de origen", () => {
  assert.deepEqual(missingTags("Click here", SRC), [
    { key: "g1", open: "<g1>", close: "</g1>" },
    { key: "x2", open: "<x2/>" },
  ]);
  assert.deepEqual(missingTags("Click <g1>here</g1>", SRC), [{ key: "x2", open: "<x2/>" }]);
});

test("guardado: conjunto completo (y orden para SDLXLIFF)", () => {
  const reordered = "Y <x2/> luego pulse <g1>aquí</g1>.";
  assert.equal(tagsComplete(reordered, SRC), true);
  assert.equal(tagsComplete(reordered, SRC, { ordered: true }), false);
  assert.equal(tagsComplete("Pulse aquí", SRC), false);
});
