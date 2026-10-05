// Anclas de cursor del editor de etiquetas: entre dos etiquetas pegadas (o con una
// etiqueta al principio o al final) no habia posicion de texto y no se podia hacer clic
// ni pasar con las flechas. El editor pone ahi un espacio de ancho cero, que NUNCA sale
// del editor. node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CARET_ANCHOR,
  editorPieces,
  stripCaretAnchors,
} from "../../components/TagEditor/tag-rules.js";

const shape = (text) =>
  editorPieces(text)
    .map((piece) =>
      piece.type === "tag" ? piece.raw : piece.type === "anchor" ? "|" : piece.value,
    )
    .join("");

test("anclas: dos etiquetas pegadas tienen una posicion de cursor entre ellas", () => {
  assert.equal(shape("Le <x1/><x2/> protocole"), "Le <x1/>|<x2/> protocole");
  assert.equal(
    shape("The<x1/> <x2/><x3/><x4/>FIFA"),
    "The<x1/> <x2/>|<x3/>|<x4/>FIFA",
  );
});

test("anclas: una etiqueta al principio o al final tiene posicion a ese lado", () => {
  assert.equal(shape("<g1>Titre</g1>"), "|<g1>Titre</g1>|");
  assert.equal(shape("<x1/>"), "|<x1/>|");
  assert.equal(shape("<g1></g1>"), "|<g1>|</g1>|", "par vacio: se puede escribir dentro");
});

test("anclas: el texto sin etiquetas, o con texto a ambos lados, no lleva ninguna", () => {
  assert.equal(shape("Titre de l'article"), "Titre de l'article");
  assert.equal(shape("Pulse <g1>aquí</g1> y <x2/> luego."), "Pulse <g1>aquí</g1> y <x2/> luego.");
  assert.deepEqual(editorPieces(""), []);
  assert.deepEqual(editorPieces(null), []);
});

test("anclas: nunca salen del editor (ida y vuelta identica)", () => {
  for (const text of [
    "Le <x1/><x2/> protocole",
    "<g1>Titre</g1>",
    "<x1/>",
    "sin etiquetas",
    "a <g1><g2>b</g2></g1>",
  ]) {
    const rendered = editorPieces(text)
      .map((piece) =>
        piece.type === "tag" ? piece.raw : piece.type === "anchor" ? CARET_ANCHOR : piece.value,
      )
      .join("");
    assert.equal(stripCaretAnchors(rendered), text);
  }
});

test("anclas: un ancla que ya venia en el texto no se duplica ni se guarda", () => {
  const dirty = `Le <x1/>${CARET_ANCHOR}<x2/>${CARET_ANCHOR} fin`;
  assert.equal(stripCaretAnchors(dirty), "Le <x1/><x2/> fin");
  assert.equal(shape(dirty), "Le <x1/>|<x2/> fin");
  assert.equal(stripCaretAnchors(null), "");
});
