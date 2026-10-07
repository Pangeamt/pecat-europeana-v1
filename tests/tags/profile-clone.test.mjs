// Clonar un perfil: el asistente de alta se abre relleno con todo lo del original y con el
// nombre "<nombre> (copia)" -- "(copia 2)", "(copia 3)"... si ya existe. "copia" / "copy" segun
// el idioma de la interfaz. node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { cloneFormValues, cloneName } from "../../lib/profile-clone.js";

test("nombre: <nombre> (copia), en el idioma que toque", () => {
  assert.equal(cloneName("FIFA_MEDICAL_DEMO_6_10", [], "copia"), "FIFA_MEDICAL_DEMO_6_10 (copia)");
  assert.equal(cloneName("FIFA_MEDICAL_DEMO_6_10", [], "copy"), "FIFA_MEDICAL_DEMO_6_10 (copy)");
  assert.equal(cloneName("  Legal  ", [], "copia"), "Legal (copia)");
});

test("nombre: si ya existe, (copia 2), (copia 3)... sin importar mayusculas", () => {
  const names = ["Legal", "Legal (copia)"];
  assert.equal(cloneName("Legal", names, "copia"), "Legal (copia 2)");
  assert.equal(cloneName("Legal", [...names, "legal (COPIA 2)"], "copia"), "Legal (copia 3)");
  assert.equal(cloneName("Legal", ["Legal (copia 2)"], "copia"), "Legal (copia)", "el primero libre");
});

test("nombre: clonar un clon numera desde el original, no apila sufijos", () => {
  const names = ["Legal", "Legal (copia)"];
  assert.equal(cloneName("Legal (copia)", names, "copia"), "Legal (copia 2)");
  assert.equal(cloneName("Legal (copia 2)", [...names, "Legal (copia 2)"], "copia"), "Legal (copia 3)");
  // el sufijo del otro idioma no se toca: es parte del nombre
  assert.equal(cloneName("Legal (copy)", [], "copia"), "Legal (copy) (copia)");
});

test("valores del asistente: todo lo del original, listo para editar", () => {
  const profile = {
    id: "p1",
    name: "FIFA",
    description: "DEMO",
    domain: "medical",
    formality: "FORMAL",
    instructions: "Keep casing",
    llmPreset: "basic",
    tms: [{ id: "tm1", name: "A" }, { id: "tm2", name: "B" }],
    glossaries: [{ id: "g1", name: "G" }],
  };
  assert.deepEqual(cloneFormValues(profile, ["FIFA"], "copia"), {
    name: "FIFA (copia)",
    description: "DEMO",
    domain: "medical",
    formality: "FORMAL",
    instructions: "Keep casing",
    llmPreset: "basic",
    tmIds: ["tm1", "tm2"],
    glossaryIds: ["g1"],
  });
});

test("valores del asistente: un perfil sin opcionales no rompe el formulario", () => {
  const values = cloneFormValues({ name: "Vacio" }, [], "copy");
  assert.equal(values.name, "Vacio (copy)");
  assert.equal(values.formality, "");
  assert.deepEqual(values.tmIds, []);
  assert.deepEqual(values.glossaryIds, []);
  assert.equal(values.llmPreset, undefined);
});
