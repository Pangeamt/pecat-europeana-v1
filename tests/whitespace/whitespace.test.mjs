// Quill NBSP flood: detection, exact repair and the server guard (lib/whitespace.js).
// The CASES are real outputs of react-quill-new 3.8.3 + quill 2.0.3 (headless Edge,
// 2026-10-22): `saved` is what PECAT stored, `before` the text the segment had and
// `expected` the text the reviewer meant. node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isQuillFlood,
  keepReviewerSpaces,
  looksFlooded,
  repairQuillFlood,
  splitWhitespace,
} from "../../lib/whitespace.js";

const NBSP = "\u00a0";

const CASES = [
  { before: "Si des membres de la d\u00e9l\u00e9gation sont ob\u00e8ses.", saved: "Si\u00a0des\u00a0membres\u00a0de\u00a0la\u00a0d\u00e9l\u00e9gation\u00a0sont\u00a0ob\u00e8ses.", expected: "Si des membres de la d\u00e9l\u00e9gation sont ob\u00e8ses.", edited: false },
  { before: "Note\u00a0: \u00ab\u00a0bonjour\u00a0\u00bb ici\u00a0!", saved: "Note\u00a0:\u00a0\u00ab\u00a0bonjour\u00a0\u00bb\u00a0ici\u00a0!", expected: "Note\u00a0: \u00ab\u00a0bonjour\u00a0\u00bb ici\u00a0!", edited: false },
  { before: "Hausse de 20\u202f% en 2026.", saved: "Hausse\u00a0de\u00a020\u00a0%\u00a0en\u00a02026.", expected: "Hausse de 20\u202f% en 2026.", edited: false },
  { before: "deux  espaces ici", saved: "deux\u00a0espaces\u00a0ici", expected: "deux  espaces ici", edited: false },
  { before: " bord gauche et droit ", saved: "bord\u00a0gauche\u00a0et\u00a0droit\u00a0", expected: " bord gauche et droit ", edited: false },
  { before: "ligne un\nligne deux", saved: "ligne\u00a0un\u00a0ligne\u00a0deux", expected: "ligne un\nligne deux", edited: false },
  { before: "col1\tcol2", saved: "col1\u00a0col2", expected: "col1\tcol2", edited: false },
  { before: "a < b & c > d", saved: "a\u00a0<\u00a0b\u00a0&\u00a0c\u00a0>\u00a0d", expected: "a < b & c > d", edited: false },
  { before: "texto &amp; entidad", saved: "texto\u00a0&\u00a0entidad", expected: "texto &amp; entidad", edited: false },
  { before: "a\u2002en\u2003em\u2009thin", saved: "a\u00a0en\u00a0em\u00a0thin", expected: "a\u2002en\u2003em\u2009thin", edited: false },
  { before: "Si des membres sont ob\u00e8ses\u00a0: le MAM est \u00ab\u00a0grave\u00a0\u00bb.", saved: "Si\u00a0des\u00a0membres\u00a0vraiment\u00a0sont\u00a0ob\u00e8ses\u00a0:\u00a0le\u00a0MAM\u00a0est\u00a0\u00ab\u00a0grave\u00a0\u00bb.", expected: "Si des membres vraiment sont ob\u00e8ses\u00a0: le MAM est \u00ab\u00a0grave\u00a0\u00bb.", edited: true },
  { before: "Hausse de 20\u202f% en 2026 selon l\u2019OMS.", saved: "Hausse\u00a0de\u00a020\u00a0%\u00a0en\u00a02026\u00a0l\u2019OMS.", expected: "Hausse de 20\u202f% en 2026 l\u2019OMS.", edited: true },
  { before: "Le mal  aigu des montagnes (MAM) peut \u00eatre grave.", saved: "Le\u00a0mal\u00a0aigu\u00a0des\u00a0montagnes\u00a0(MAM)\u00a0peut\u00a0\u00eatre\u00a0plus\u00a0grave.", expected: "Le mal  aigu des montagnes (MAM) peut \u00eatre plus grave.", edited: true },
];

test("the real Quill outputs are all detected as the flood", () => {
  for (const c of CASES) assert.equal(isQuillFlood(c.saved), true, c.saved);
});

test("repair gives back exactly what the reviewer meant", () => {
  for (const c of CASES) {
    const { text, kind } = repairQuillFlood(c.saved, c.before);
    assert.equal(text, c.expected);
    assert.equal(kind, c.edited ? "aligned" : "exact");
  }
});

test("an unedited segment comes back byte for byte (legit NBSP, NNBSP, EN/EM, double spaces, line breaks)", () => {
  for (const c of CASES.filter((x) => !x.edited)) assert.equal(repairQuillFlood(c.saved, c.before).text, c.before);
});

test("an edit next to a kept word keeps that word's separator (French NBSP before a colon)", () => {
  const before = `la fonction est mémorisée grâce au principe DROP pneumonique${NBSP}:`;
  const saved = ["la", "fonction", "est", "mémorisée", "grâce", "au", "moyen", "DROP", ":"].join(NBSP);
  assert.equal(repairQuillFlood(saved, before).text, `la fonction est mémorisée grâce au moyen DROP${NBSP}:`);
});

test("texts that are not Quill output are never touched", () => {
  for (const t of ["Texte normal.", `Note${NBSP}: avec espace`, "", "mot"]) {
    assert.equal(repairQuillFlood(t, "x").kind, "skip");
    assert.equal(keepReviewerSpaces(t, { previous: "x y", mt: "x y" }), t);
  }
});

test("the server guard leaves short legitimate NBSP texts alone", () => {
  for (const t of [`20${NBSP}%`, `Question${NBSP}7`, `fatigue${NBSP};`]) {
    assert.equal(looksFlooded(t), false);
    assert.equal(keepReviewerSpaces(t, { previous: t.replace(NBSP, " "), mt: "" }), t);
  }
});

test("the server guard repairs a flooded text against the previous one, or the MT if that was flooded too", () => {
  const mt = `Si des membres sont obèses${NBSP}: le MAM est grave.`;
  const saved = ["Si", "des", "membres", "sont", "obèses", ":", "le", "MAM", "est", "grave."].join(NBSP);
  assert.equal(keepReviewerSpaces(saved, { previous: mt, mt }), mt);
  assert.equal(keepReviewerSpaces(saved, { previous: saved, mt }), mt);
  assert.equal(keepReviewerSpaces(saved, { previous: null, mt }), mt);
  assert.equal(keepReviewerSpaces(saved, { previous: null, mt: null }), saved);
});

test("splitWhitespace keeps every character and tags each kind", () => {
  const text = `a b${NBSP}c\u202fd\u2003e\tf`;
  const parts = splitWhitespace(text);
  assert.equal(parts.map((p) => p.text).join(""), text);
  assert.deepEqual(parts.filter((p) => p.ws).map((p) => p.ws.kind), ["space", "nbsp", "nnbsp", "other", "tab"]);
});
