// Inline tags: what reaches MTQE/post_edit (WITH their tags since 2026-10-02) and
// the editor rules (Trados model: reference = source tags).
// node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { suggestionKeepsTags, toQeReferences } from "../../modules/documents/qe-payload.js";
import { exportTarget } from "../../modules/documents/export-target.js";
import { checkTagEdit, missingTags, tagsComplete } from "../../components/TagEditor/tag-rules.js";

const SRC = "Pulse <g1>aquí</g1> y <x2/> luego.";

test("las referencias de TM/glosario van tal cual, con sus marcadores, y con tope", () => {
  const refs = toQeReferences([
    { source: "Pressure pipe <x1/> 1", target: "Tuyau <x1/> 1", tm_score: 1 },
    { source: "B", target: "b" },
    { source: "C", target: "c" },
  ]);
  assert.deepEqual(refs, [
    { source: "Pressure pipe <x1/> 1", target: "Tuyau <x1/> 1" },
    { source: "B", target: "b" },
  ]);
  assert.deepEqual(toQeReferences(null), []);
  assert.deepEqual(toQeReferences([{ source: "A" }]), [], "sin target no es referencia");
});

test("una sugerencia del LLM solo se admite si conserva las etiquetas del origen", () => {
  const ok = "Click <g1>here</g1> and <x2/> then.";
  assert.equal(suggestionKeepsTags(SRC, ok), true);
  assert.equal(suggestionKeepsTags(SRC, "Click here and then."), false, "pierde las etiquetas");
  assert.equal(suggestionKeepsTags(SRC, "Click <g1>here</g1> then."), false, "pierde <x2/>");
  assert.equal(suggestionKeepsTags(SRC, ok + " <x9/>"), false, "inventa una etiqueta");
  assert.equal(suggestionKeepsTags("sin etiquetas", "tampoco"), true);
  assert.equal(suggestionKeepsTags("sin etiquetas", "inventa <x1/>"), false);
});

test("sugerencia con las etiquetas reordenadas: solo falla donde se exige el orden", () => {
  const src = "A <x1/> B <x2/> C";
  const swapped = "A' <x2/> B' <x1/> C'";
  assert.equal(suggestionKeepsTags(src, swapped), true, "por conjunto pasa");
  assert.equal(suggestionKeepsTags(src, swapped, { ordered: true }), false, "SDLXLIFF/XLIFF: orden");
  assert.equal(suggestionKeepsTags(src, "A' <x1/> B' <x2/> C'", { ordered: true }), true);
});

test("export: el texto del revisor solo cuenta si esta aprobado", () => {
  const base = { translatedLiteral: "MT", reviewLiteral: "REV" };
  assert.equal(exportTarget({ ...base, Status: "ACCEPTED" }), "REV");
  assert.equal(exportTarget({ ...base, Status: "EDITED" }), "REV");
  assert.equal(exportTarget({ ...base, Status: "NOT_REVIEWED" }), "MT", "borrador guardado");
  assert.equal(exportTarget({ ...base, Status: "TRANSLATED_MT" }), "MT");
  assert.equal(exportTarget({ ...base, Status: "REJECTED" }), "MT", "rechazado: vuelve la MT");
  assert.equal(exportTarget({ Status: "EDITED", reviewLiteral: "REV" }), "REV");
  assert.equal(exportTarget({ Status: "NOT_REVIEWED" }), "");
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

test("inlineTagsMatch usa la misma forma de marcador que el resto (<h1> no es etiqueta)", async () => {
  const { inlineTagsMatch, extractInlineTags } = await import("../../modules/documents/pipeline-constants.js");
  assert.deepEqual(extractInlineTags("Título <h1> y <p2> con <x1/>"), ["<x1/>"]);
  assert.equal(inlineTagsMatch("A <g1>b</g1>", "B <g1>c</g1>"), true);
  assert.equal(inlineTagsMatch("A <g1>b</g1>", "B c"), false);
});
