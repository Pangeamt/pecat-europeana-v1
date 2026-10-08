// Plain XLIFF 1.2 handled the way Trados Studio 2022 handles the same file
// (measured on the client's environment_fr.json.xlf and rheumatology_fr.json.xlf,
// 2026-10-08): with the same translations, the exported <target> of every unit
// is the one Trados writes.
//   D1  a target with no state that is a copy of its source is not a translation
//   D2  the codes at the very edge of an untranslated unit stay out of its segments
// node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { readSdlxliffSegments } from "../../modules/documents/sdlxliff/reader.js";
import { writeSdlxliff } from "../../modules/documents/sdlxliff/writer.js";
import { peelEdgeCodes } from "../../modules/documents/sdlxliff/segmenter.js";

const NS = "urn:oasis:names:tc:xliff:document:1.2";
const wrap = (units) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<xliff version="1.2" xmlns="${NS}">\n` +
  `  <file source-language="en-GB" target-language="fr-FR" datatype="xml" original="a">\n    <body>\n${units}\n    </body>\n  </file>\n</xliff>\n`;
const ext = (s) => (s.mid != null ? `${s.transUnitId}::${s.mid}` : s.transUnitId);
// A row as the import stores it for a segment DAAIT translated.
const mt = (segment, text, extra = {}) => ({
  externalId: ext(segment),
  srcLiteral: segment.source,
  translatedLiteral: text,
  Status: "TRANSLATED_MT",
  fileTarget: false,
  ...extra,
});
const targetOf = (text, id) =>
  new RegExp(`<trans-unit id="${id}"[\\s\\S]*?</source>\\s*(<target\\b[^>]*?(?:/>|>[\\s\\S]*?</target>))`).exec(text)?.[1] ?? null;

test("D2 · códigos de borde: se separan los <x/> del principio y del final, con su espacio", () => {
  assert.deepEqual(peelEdgeCodes("<x1/><x2/>Select the headings.<x3/><x4/>"), {
    lead: "<x1/><x2/>",
    core: "Select the headings.",
    trail: "<x3/><x4/>",
  });
  assert.deepEqual(peelEdgeCodes("<x1/> Text <x2/>"), { lead: "<x1/> ", core: "Text", trail: " <x2/>" });
  // Un código en medio del texto es del segmento.
  assert.deepEqual(peelEdgeCodes("<x1/>D<x2/>escent"), { lead: "<x1/>", core: "D<x2/>escent", trail: "" });
  // Los pares que envuelven texto no son de borde.
  assert.deepEqual(peelEdgeCodes("<g1>Bold</g1>"), { lead: "", core: "<g1>Bold</g1>", trail: "" });
  assert.deepEqual(peelEdgeCodes("<b1/>Bold<e1/>"), { lead: "", core: "<b1/>Bold<e1/>", trail: "" });
  assert.deepEqual(peelEdgeCodes("<x1/><g2>Bold</g2><x3/>"), { lead: "<x1/>", core: "<g2>Bold</g2>", trail: "<x3/>" });
  // Sin nada que traducir no se separa nada; y unir las tres partes da la entrada.
  assert.deepEqual(peelEdgeCodes("<x1/><x2/>"), { lead: "", core: "<x1/><x2/>", trail: "" });
  for (const coded of ["<x1/>A. B.<x2/>", "A", "", "<x9/>  A <g1>b</g1>  <x10/><x11/>"]) {
    const { lead, core, trail } = peelEdgeCodes(coded);
    assert.equal(lead + core + trail, coded, coded);
  }
});

test("D2 · lector: una unidad sin traducir pierde sus códigos de borde; una ya traducida los conserva", () => {
  const raw = wrap(
    `      <trans-unit id="a"><source><x id="x1"/>D<x id="x2"/>escent</source><target/></trans-unit>\n` +
      `      <trans-unit id="b"><source><x id="x3"/><x id="x4"/>Select the headings.<x id="x5"/><x id="x6"/></source><target/></trans-unit>\n` +
      `      <trans-unit id="c"><source><x id="x7"/>R<x id="x8"/>est</source><target state="translated">Repos<x id="x7"/><x id="x8"/></target></trans-unit>\n` +
      `      <trans-unit id="d"><source><x id="x9"/>First part: Second one.<x id="x10"/></source><target/></trans-unit>`,
  );
  const segments = readSdlxliffSegments(raw).segments;
  assert.deepEqual(
    segments.map((s) => [s.segmentNumber, ext(s), s.source]),
    [
      [1, "a", "D<x2/>escent"],
      [2, "b", "Select the headings."],
      [3, "c", "<x1/>R<x2/>est"],
      [4, "d::~1", "First part:"],
      [5, "d::~2", "Second one."],
    ],
  );
  assert.equal(segments[2].target, "Repos<x1/><x2/>");
});

test("D2 · escritor: los códigos de borde vuelven alrededor de la traducción, byte a byte", () => {
  const raw = wrap(
    `      <trans-unit id="a"><source><x id="x1"/>D<x id="x2"/>escent</source><target/></trans-unit>\n` +
      `      <trans-unit id="b"><source><x id="x3"/><x id="x4"/>Select the headings.<x id="x5"/> <x id="x6"/></source><target state-qualifier="fuzzy-match"/></trans-unit>\n` +
      `      <trans-unit id="d"><source><x id="x9"/>First part:  Second one.<x id="x10"/></source></trans-unit>`,
  );
  const [a, b, d1, d2] = readSdlxliffSegments(raw).segments;
  const { text, report } = writeSdlxliff(raw, [
    mt(a, "D<x2/>escente"),
    mt(b, "Sélectionnez les titres."),
    mt(d1, "Première partie :"),
    mt(d2, "Deuxième."),
  ]);
  assert.equal(report.written, 4);
  assert.equal(report.skippedTags, 0);
  assert.equal(targetOf(text, "a"), '<target state="needs-translation"><x id="x1"/>D<x id="x2"/>escente</target>');
  assert.equal(
    targetOf(text, "b"),
    '<target state-qualifier="fuzzy-match" state="needs-translation"><x id="x3"/><x id="x4"/>Sélectionnez les titres.<x id="x5"/> <x id="x6"/></target>',
  );
  assert.equal(
    targetOf(text, "d"),
    '<target state="needs-translation"><x id="x9"/>Première partie :  Deuxième.<x id="x10"/></target>',
  );
});

test("D2 · escritor: un segmento sin sus códigos de borde no admite que el traductor los añada", () => {
  const raw = wrap(`      <trans-unit id="a"><source><x id="x1"/>Text<x id="x2"/></source><target/></trans-unit>`);
  const [a] = readSdlxliffSegments(raw).segments;
  assert.equal(a.source, "Text");
  const { text, report } = writeSdlxliff(raw, [mt(a, "<x1/>Texte<x2/>")]);
  assert.equal(report.skippedTags, 1);
  assert.equal(text, raw);
});

test("D2 · documentos importados antes (códigos de borde dentro del segmento) se exportan igual", () => {
  const raw = wrap(
    `      <trans-unit id="a"><source><x id="x1"/>Text<x id="x2"/></source><target/></trans-unit>\n` +
      `      <trans-unit id="d"><source><x id="x9"/>First part: Second one.<x id="x10"/></source><target/></trans-unit>`,
  );
  const old = (externalId, srcLiteral, translatedLiteral) => ({ externalId, srcLiteral, translatedLiteral, Status: "TRANSLATED_MT" });
  const { text, report } = writeSdlxliff(raw, [
    old("a", "<x1/>Text<x2/>", "<x1/>Texte<x2/>"),
    old("d::~1", "<x1/>First part:", "<x1/>Première partie :"),
    old("d::~2", "Second one.<x2/>", "Deuxième.<x2/>"),
  ]);
  assert.equal(report.written, 3);
  assert.equal(targetOf(text, "a"), '<target state="needs-translation"><x id="x1"/>Texte<x id="x2"/></target>');
  assert.equal(targetOf(text, "d"), '<target state="needs-translation"><x id="x9"/>Première partie : Deuxième.<x id="x10"/></target>');
});

test("D1 · lector: destino sin state que copia el origen = sin traducir (y la unidad no se parte)", () => {
  const raw = wrap(
    `      <trans-unit id="a"><source>{{_globals.hideFeedback}}</source><target state-qualifier="leveraged-tm">{{_globals.hideFeedback}}</target></trans-unit>\n` +
      `      <trans-unit id="b"><source><x id="x1"/>Consensus statement. Second sentence.<x id="x2"/></source><target state-qualifier="leveraged-tm"><x id="x1"/>Consensus statement. Second sentence.<x id="x2"/></target></trans-unit>\n` +
      `      <trans-unit id="c"><source>Rest</source><target state-qualifier="leveraged-tm">Repos</target></trans-unit>\n` +
      `      <trans-unit id="d"><source>FIFA</source><target state="translated">FIFA</target></trans-unit>\n` +
      `      <trans-unit id="e" approved="yes"><source>Search</source><target>Search</target></trans-unit>\n` +
      `      <trans-unit id="f"><source>HLA-B27</source><target state="signed-off">HLA-B27</target></trans-unit>`,
  );
  const by = Object.fromEntries(readSdlxliffSegments(raw).segments.map((s) => [ext(s), s]));
  assert.deepEqual(Object.keys(by), ["a", "b", "c", "d", "e", "f"], "ninguna se parte: todas traían destino");
  assert.equal(by.a.target, null, "copia del origen sin state: va al motor");
  assert.equal(by.b.target, null, "con etiquetas y dos frases, igual");
  assert.equal(by.b.source, "<x1/>Consensus statement. Second sentence.<x2/>", "y conserva sus códigos de borde, como en Trados");
  assert.equal(by.c.target, "Repos", "sin state pero distinto del origen: es una traducción");
  assert.equal(by.d.target, "FIFA", "igual al origen pero con state=translated: el cliente lo dio por traducido");
  assert.equal(by.e.target, "Search", "aprobado por el cliente: no se toca");
  assert.equal(by.e.locked, true);
  assert.equal(by.f.locked, true);
});

test("D1 · escritor: lo que el motor devuelve igual sale con state=needs-translation; lo distinto, con su texto", () => {
  const raw = wrap(
    `      <trans-unit id="a"><source>{{_globals.hideFeedback}}</source><target state-qualifier="leveraged-tm">{{_globals.hideFeedback}}</target></trans-unit>\n` +
      `      <trans-unit id="b"><source>Consensus statement.</source><target state-qualifier="leveraged-tm">Consensus statement.</target></trans-unit>\n` +
      `      <trans-unit id="c"><source>Rest</source><target state-qualifier="leveraged-tm">Repos</target></trans-unit>`,
  );
  const [a, b, c] = readSdlxliffSegments(raw).segments;
  const { text, report } = writeSdlxliff(raw, [
    mt(a, "{{_globals.hideFeedback}}"),
    mt(b, "Déclaration de consensus."),
    // The client's translation, as the import stores it: nobody touched it.
    { externalId: ext(c), srcLiteral: c.source, translatedLiteral: c.target, Status: "NOT_REVIEWED", fileTarget: true },
  ]);
  assert.equal(targetOf(text, "a"), '<target state-qualifier="leveraged-tm" state="needs-translation">{{_globals.hideFeedback}}</target>');
  assert.equal(targetOf(text, "b"), '<target state-qualifier="leveraged-tm" state="needs-translation">Déclaration de consensus.</target>');
  assert.equal(targetOf(text, "c"), '<target state-qualifier="leveraged-tm">Repos</target>', "la traducción del cliente sin tocar no se escribe");
  assert.equal(report.written, 1);
  assert.equal(report.unchanged, 2);
});

test("D1 · escritor: confirmado por un revisor pasa a translated, cambie o no el texto", () => {
  const raw = wrap(`      <trans-unit id="a"><source>HLA-B27</source><target state-qualifier="x-alphanum">HLA-B27</target></trans-unit>`);
  const [a] = readSdlxliffSegments(raw).segments;
  const { text } = writeSdlxliff(raw, [mt(a, "HLA-B27", { reviewLiteral: "HLA-B27", Status: "ACCEPTED" })]);
  assert.equal(targetOf(text, "a"), '<target state-qualifier="x-alphanum" state="translated">HLA-B27</target>');
});

test("D1 · XLIFF 2.x y SDLXLIFF no cambian: su estado lo dice el propio formato", () => {
  const v2 =
    `<?xml version="1.0"?>\n<xliff xmlns="urn:oasis:names:tc:xliff:document:2.0" version="2.0" srcLang="en" trgLang="fr">` +
    `<file id="f"><unit id="u"><segment><source>FIFA</source><target>FIFA</target></segment></unit></file></xliff>`;
  assert.equal(readSdlxliffSegments(v2).segments[0].target, "FIFA");
  const segmented = wrap(
    `      <trans-unit id="a"><source>FIFA</source><seg-source><mrk mtype="seg" mid="1">FIFA</mrk></seg-source><target><mrk mtype="seg" mid="1">FIFA</mrk></target></trans-unit>`,
  );
  assert.equal(readSdlxliffSegments(segmented).segments[0].target, "FIFA");
});
