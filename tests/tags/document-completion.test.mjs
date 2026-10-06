// Cuando se puede entregar el fichero procesado: solo con TODOS los segmentos bloqueados o
// confirmados (un rechazado tambien lo impide); un administrador puede llevarselo antes como
// entrega parcial. Y el nombre del procesado, que nunca es el del original.
// node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PARTIAL_LINK_PREFIX,
  completionOf,
  confirmableRows,
  isSegmentDone,
  mayDeliver,
  processedFilename,
} from "../../lib/document-completion.js";

const tu = (over) => ({ Status: "NOT_REVIEWED", block: false, visible: true, ...over });

test("terminado: bloqueado o confirmado (con o sin cambios); sin revisar y rechazado no", () => {
  assert.equal(isSegmentDone(tu({ block: true, Status: "ACCEPTED" })), true);
  assert.equal(isSegmentDone(tu({ block: true, Status: "NOT_REVIEWED" })), true, "bloqueado a mano");
  assert.equal(isSegmentDone(tu({ Status: "ACCEPTED" })), true);
  assert.equal(isSegmentDone(tu({ Status: "EDITED" })), true);
  assert.equal(isSegmentDone(tu({ Status: "NOT_REVIEWED" })), false);
  assert.equal(isSegmentDone(tu({ Status: "TRANSLATED_MT" })), false);
  assert.equal(isSegmentDone(tu({ Status: "REJECTED" })), false);
});

test("recuento: los ocultos no cuentan y los rechazados se cuentan aparte", () => {
  const c = completionOf([
    tu({ block: true, Status: "ACCEPTED" }),
    tu({ Status: "ACCEPTED" }),
    tu({ Status: "EDITED" }),
    tu({ Status: "TRANSLATED_MT" }),
    tu({ Status: "REJECTED" }),
    tu({ Status: "NOT_REVIEWED", visible: false }),
  ]);
  assert.deepEqual(c, { total: 5, done: 3, locked: 1, confirmed: 2, pending: 2, rejected: 1, complete: false });
});

test("completo: solo cuando no queda NINGUNO pendiente ni rechazado", () => {
  assert.equal(completionOf([tu({ block: true }), tu({ Status: "EDITED" })]).complete, true);
  assert.equal(completionOf([tu({ block: true }), tu({ Status: "REJECTED" })]).complete, false, "un rechazado lo impide");
  assert.equal(completionOf([tu({ Status: "ACCEPTED" }), tu({ Status: "TRANSLATED_MT" })]).complete, false);
  assert.equal(completionOf([]).complete, false, "sin segmentos no hay nada que entregar");
  assert.equal(completionOf([tu({ Status: "ACCEPTED" }), tu({ Status: "NOT_REVIEWED", visible: false })]).complete, true);
});

test("entrega: completa siempre; incompleta solo con un enlace de entrega parcial", () => {
  const done = completionOf([tu({ Status: "ACCEPTED" })]);
  const half = completionOf([tu({ Status: "ACCEPTED" }), tu({ Status: "NOT_REVIEWED" })]);
  assert.equal(mayDeliver(done), true);
  assert.equal(mayDeliver(half), false);
  assert.equal(mayDeliver(half, { partialLink: true }), true);
  assert.equal(PARTIAL_LINK_PREFIX, "partial-");
});

test("nombre del procesado: TODOS los formatos igual, acabado en origen_destino; nunca el del original", () => {
  const pair = { source: "en-GB", target: "fr-FR" };
  assert.equal(processedFilename("environment_fr.json.xlf", pair), "environment_fr.json-en-GB_fr-FR.xlf");
  assert.equal(processedFilename("b27usfrs0c4524a08.xml.sdlxliff", pair), "b27usfrs0c4524a08.xml-en-GB_fr-FR.sdlxliff");
  assert.equal(processedFilename("Informe final.docx", { source: "es", target: "en" }), "Informe final-es_en.docx");
  assert.equal(processedFilename("Presentacion.pptx", { source: "es", target: "es" }), "Presentacion-es_es.pptx", "mismo idioma: salen los dos");
  // un PDF se entrega como .docx: cambia la extension, no el patron
  assert.equal(processedFilename("contrato.pdf", { ...pair, extension: ".docx" }), "contrato-en-GB_fr-FR.docx");
  // codigos con guion bajo (como llegan en un .xlf) y caracteres raros
  assert.equal(processedFilename("a.xlf", { source: "en_GB", target: "fr_FR" }), "a-en-GB_fr-FR.xlf");
  assert.equal(processedFilename("a.xlf", { source: "en/GB", target: " fr " }), "a-enGB_fr.xlf");
  assert.equal(processedFilename("sinextension", pair), "sinextension-en-GB_fr-FR");
});

test("nombre del procesado: sin idiomas conocidos cae al sufijo .processed", () => {
  assert.equal(processedFilename("environment_fr.json.xlf"), "environment_fr.json.processed.xlf");
  assert.equal(processedFilename("a.docx", { source: "", target: null }), "a.processed.docx");
  assert.equal(processedFilename("a.docx", { target: "fr" }), "a-fr.docx", "solo destino: el que hay");
  assert.equal(processedFilename(""), "document.processed");
});

test("confirmar todo lo del filtro: solo los pendientes, sin bloquear, con texto; los rechazados se dejan", () => {
  const rows = [
    { id: "a", Status: "TRANSLATED_MT", block: false, text: "Texte" },
    { id: "b", Status: "NOT_REVIEWED", block: false, text: "Texte" },
    { id: "c", Status: "ACCEPTED", block: false, text: "Texte" },
    { id: "d", Status: "NOT_REVIEWED", block: true, text: "Texte" },
    { id: "e", Status: "REJECTED", block: false, text: "Texte" },
    { id: "f", Status: "NOT_REVIEWED", block: false, text: "   " },
    { id: "g", Status: "EDITED", block: false, text: "Texte" },
  ];
  assert.deepEqual(confirmableRows(rows, (r) => r.text).map((r) => r.id), ["a", "b"]);
  assert.deepEqual(confirmableRows(null, () => "x"), []);
});
