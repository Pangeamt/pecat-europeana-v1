// Plain XLIFF 1.2 (.xlf / .xliff): a unit with no translation is cut into its
// sentences the way Trados Studio does, and the export puts them back in the
// unit's single <target>. The rule was measured against Studio 2019 on the
// client's file (environment_fr.json.xlf: 1,555 units -> 1,577 segments).
// node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { readSdlxliffSegments } from "../../modules/documents/sdlxliff/reader.js";
import { writeSdlxliff } from "../../modules/documents/sdlxliff/writer.js";
import { locateSentences, splitCoded } from "../../modules/documents/sdlxliff/segmenter.js";

const NS = "urn:oasis:names:tc:xliff:document:1.2";
const wrap = (units) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<xliff version="1.2" xmlns="${NS}">\n` +
  `  <file source-language="en-GB" target-language="fr-FR" datatype="xml" original="a">\n    <body>\n${units}\n    </body>\n  </file>\n</xliff>\n`;
const texts = (coded) => splitCoded(coded).map((part) => part.text);
const tu = (externalId, translatedLiteral, extra = {}) => ({ externalId, translatedLiteral, Status: "TRANSLATED_MT", ...extra });

test("regla de corte: los casos medidos en Trados", () => {
  assert.deepEqual(texts("Requires a different approach to HACE. In HAPE, therapies are limited."), [
    "Requires a different approach to HACE.",
    "In HAPE, therapies are limited.",
  ]);
  assert.deepEqual(texts("5. Altitude"), ["5.", "Altitude"]);
  assert.deepEqual(texts("Under 18°: Low-risk"), ["Under 18°:", "Low-risk"]);
  assert.deepEqual(texts("Walsh K, Holle R et al. Journal of Training, 2013, 48(2):258–270."), [
    "Walsh K, Holle R et al.",
    "Journal of Training, 2013, 48(2):258–270.",
  ]);
  assert.deepEqual(texts("Is it safe? Yes! Go on."), ["Is it safe?", "Yes!", "Go on."]);
});

test("regla de corte: donde Trados NO corta", () => {
  for (const whole of [
    "It has risen to 32°C. This treatment is done in hospital.", // una mayúscula suelta y punto
    "dilution of sweat (i.e. the concentration is reduced).", // sigue minúscula
    "the impact on football: extremes of temperature.", // dos puntos y minúscula
    "is obesity.19 Therefore, it can be said", // sin espacio tras el punto
    "One sentence only.",
    "",
  ]) {
    assert.deepEqual(texts(whole), [whole], whole);
  }
});

test("corte: unir hueco + texto devuelve la entrada, y las etiquetas van con su frase", () => {
  const coded = "<x1/><x2/>First part:  <x3/>Second one.<x4/> Third.<x5/>";
  const parts = splitCoded(coded);
  assert.equal(parts.map((part) => part.gap + part.text).join(""), coded);
  assert.deepEqual(parts.map((part) => part.text), ["<x1/><x2/>First part:", "<x3/>Second one.<x4/>", "Third.<x5/>"]);
  assert.deepEqual(parts.map((part) => part.gap), ["", "  ", " "]);
});

test("corte: nunca deja un par <gN> a medias", () => {
  assert.deepEqual(texts("<g1>One. Two.</g1>"), ["<g1>One. Two.</g1>"]);
  assert.deepEqual(texts("<g1>One.</g1> <g2>Two.</g2>"), ["<g1>One.</g1>", "<g2>Two.</g2>"]);
});

test("lector: corta solo las unidades sin traducción y numera como Trados", () => {
  const raw = wrap(
    `      <trans-unit id="a"><source>Title</source><target/></trans-unit>\n` +
      `      <trans-unit id="b"><source>First one. Second one.</source><target state-qualifier="fuzzy-match"/></trans-unit>\n` +
      `      <trans-unit id="c"><source>Third. Fourth.</source><target>Troisième. Quatrième.</target></trans-unit>\n` +
      `      <trans-unit id="d"><source>5. Altitude</source></trans-unit>\n` +
      `      <trans-unit id="e"><source>Last</source><target/></trans-unit>`,
  );
  const segments = readSdlxliffSegments(raw).segments;
  assert.deepEqual(
    segments.map((s) => [s.segmentNumber, s.transUnitId, s.mid, s.source]),
    [
      [1, "a", null, "Title"],
      [2, "b", "~1", "First one."],
      [3, "b", "~2", "Second one."],
      [4, "c", null, "Third. Fourth."],
      [5, "d", "~1", "5."],
      [6, "d", "~2", "Altitude"],
      [7, "e", null, "Last"],
    ],
  );
  assert.equal(segments[3].target, "Troisième. Quatrième.", "con traducción: la unidad entera, sin cortar");
});

test("XLIFF 2.x no se corta: ya viene segmentado por sus <segment>", () => {
  const raw =
    `<?xml version="1.0"?>\n<xliff xmlns="urn:oasis:names:tc:xliff:document:2.0" version="2.0" srcLang="en" trgLang="fr">` +
    `<file id="f"><unit id="u"><segment><source>First one. Second one.</source></segment></unit></file></xliff>`;
  const segments = readSdlxliffSegments(raw).segments;
  assert.equal(segments.length, 1);
  assert.equal(segments[0].mid, null);
});

test("escritor: las frases vuelven a UN target por unidad, con su separación y sus etiquetas", () => {
  const raw = wrap(
    `      <trans-unit id="b"><source><x id="x1"/>First one.  Second one.<x id="x2"/></source><target state-qualifier="fuzzy-match"/></trans-unit>\n` +
      `      <trans-unit id="d">\n        <source>5. Altitude</source>\n      </trans-unit>`,
  );
  const { text, report } = writeSdlxliff(raw, [
    tu("b::~2", "Deuxième.<x2/>"),
    tu("b::~1", "<x1/>Premier."),
    tu("d::~1", "5."),
    tu("d::~2", "Altitude"),
  ]);
  assert.equal(report.written, 4);
  assert.equal(report.targetCreated, 1);
  assert.match(
    text,
    /<target state-qualifier="fuzzy-match" state="needs-translation"><x id="x1"\/>Premier\.  Deuxième\.<x id="x2"\/><\/target>/,
  );
  assert.match(text, /<source>5\. Altitude<\/source>\n {8}<target state="needs-translation">5\. Altitude<\/target>/);
  assert.equal(readSdlxliffSegments(text).segments.length, 2, "el entregable sigue teniendo una unidad por trans-unit");
});

test("escritor: una unidad con una frase sin traducir no se entrega a medias", () => {
  const raw = wrap(`      <trans-unit id="b"><source>First one. Second one.</source><target/></trans-unit>`);
  const { text, report } = writeSdlxliff(raw, [tu("b::~1", "Premier."), tu("b::~2", "")]);
  assert.equal(report.skippedIncomplete, 1);
  assert.equal(report.written, 0);
  assert.equal(text, raw);
});

test("escritor: el estado de la unidad es el de su frase menos avanzada", () => {
  const raw = wrap(`      <trans-unit id="b"><source>First one. Second one.</source><target/></trans-unit>`);
  const approved = (id, value) => tu(id, value, { reviewLiteral: value, Status: "ACCEPTED" });
  const both = writeSdlxliff(raw, [approved("b::~1", "Premier."), approved("b::~2", "Deuxième.")]).text;
  assert.match(both, /<target state="translated">Premier\. Deuxième\.<\/target>/);
  const one = writeSdlxliff(raw, [approved("b::~1", "Premier."), tu("b::~2", "Deuxième.")]).text;
  assert.match(one, /<target state="needs-translation">/);
  const rejected = writeSdlxliff(raw, [approved("b::~1", "Premier."), tu("b::~2", "Deuxième.", { Status: "REJECTED" })]).text;
  assert.match(rejected, /<target state="needs-review-translation">/);
});

test("escritor: una etiqueta perdida en una frase deja fuera la unidad entera", () => {
  const raw = wrap(`      <trans-unit id="b"><source>First one. <x id="x1"/>Second one.</source><target/></trans-unit>`);
  const { text, report } = writeSdlxliff(raw, [tu("b::~1", "Premier."), tu("b::~2", "Deuxième.")]);
  assert.equal(report.skippedTags, 2);
  assert.equal(text, raw);
});

test("documentos importados antes del corte se exportan igual (externalId sin mid)", () => {
  const raw = wrap(`      <trans-unit id="b"><source>First one. Second one.</source><target/></trans-unit>`);
  const { text, report } = writeSdlxliff(raw, [tu("b", "Premier. Deuxième.")]);
  assert.equal(report.written, 1);
  assert.match(text, /<target state="needs-translation">Premier\. Deuxième\.<\/target>/);
});

test("regla de corte: abreviaturas de Trados para inglés (y solo con origen en inglés)", () => {
  for (const whole of [
    "MHC class I genes (e.g. HLA-B27).",
    "See Dr. Smith in Fig. 2 of No. 5 vs. Table A etc. Then go.",
    "Made in the U.S. Army bases.",
    "Give it at 9 a.m. Then rest.",
  ]) {
    assert.deepEqual(texts(whole), [whole], whole);
  }
  // No es abreviatura de la lista: corta.
  assert.deepEqual(texts("Walsh K et al. Journal of Training."), ["Walsh K et al.", "Journal of Training."]);
  // La abreviatura tiene que ser una palabra entera.
  assert.deepEqual(texts("He lost his vs. Then left."), ["He lost his vs. Then left."]);
  assert.deepEqual(texts("Use the canvas. Then paint."), ["Use the canvas.", "Then paint."]);
  // Otro idioma de origen: sin su lista, la abreviatura inglesa no cuenta.
  assert.deepEqual(
    splitCoded("See Dr. Smith.", { language: "fr-FR" }).map((part) => part.text),
    ["See Dr.", "Smith."],
  );
});

test("regla de corte: puntuación de cierre entre el punto y el espacio", () => {
  assert.deepEqual(texts('He said "Stop." Then he left (at last.) Nobody saw.'), [
    'He said "Stop."',
    "Then he left (at last.)",
    "Nobody saw.",
  ]);
  assert.deepEqual(texts("Wait... Then go. Wait... then stay."), ["Wait...", "Then go.", "Wait... then stay."]);
  assert.deepEqual(texts("Really?! Yes. no, sorry."), ["Really?!", "Yes. no, sorry."]);
  assert.deepEqual(texts("First, second; Third, Fourth"), ["First, second; Third, Fourth"]);
});

test("lector: un target con solo un espacio ya no es 'sin traducir' para Trados, y no se parte", () => {
  const raw = wrap(
    `      <trans-unit id="a"><source>First one. Second one.</source><target state="new"> </target></trans-unit>
` +
      `      <trans-unit id="b"><source>Third one. Fourth one.</source><target></target></trans-unit>
` +
      `      <trans-unit id="c"><source>5. Altitude</source><target state="new"><x id="1"/></target></trans-unit>`,
  );
  const segments = readSdlxliffSegments(raw).segments;
  assert.deepEqual(
    segments.map((s) => [s.transUnitId, s.mid, s.target]),
    [
      ["a", null, null],
      ["b", "~1", null],
      ["b", "~2", null],
      // state="new": su contenido es un relleno, no una traducción.
      ["c", null, null],
    ],
  );
});

test("unir por lo importado: las frases se localizan por su origen guardado", () => {
  const coded = "<x1/>First part:  <x3/>Second one.<x4/> Third.<x5/>";
  assert.deepEqual(locateSentences(coded, ["<x1/>First part:", "<x3/>Second one.<x4/>", "Third.<x5/>"]), [
    { gap: "", text: "<x1/>First part:" },
    { gap: "  ", text: "<x3/>Second one.<x4/>" },
    { gap: " ", text: "Third.<x5/>" },
  ]);
  assert.equal(locateSentences(coded, ["<x1/>First part:", "Third.<x5/>"]), null, "falta una frase");
  assert.equal(locateSentences(coded, ["<x3/>Second one.<x4/>", "<x1/>First part:"]), null, "fuera de orden");
  assert.equal(locateSentences(coded, ["<x1/>First part:", "<x3/>Second one.<x4/>"]), null, "sobra texto al final");
  assert.equal(locateSentences(coded, [null]), null);
});

test("escritor: un documento cortado con una regla anterior se sigue pudiendo unir", () => {
  // Importado cuando "(e.g." aún cortaba: hoy la regla da una sola frase.
  const raw = wrap(`      <trans-unit id="a"><source>Class I genes (e.g. HLA-B27).</source><target/></trans-unit>`);
  assert.equal(readSdlxliffSegments(raw).segments.length, 1);
  const { text, report } = writeSdlxliff(raw, [
    tu("a::~1", "gènes de classe I (p. ex.", { srcLiteral: "Class I genes (e.g." }),
    tu("a::~2", "HLA-B27).", { srcLiteral: "HLA-B27)." }),
  ]);
  assert.equal(report.written, 2);
  assert.ok(text.includes('<target state="needs-translation">gènes de classe I (p. ex. HLA-B27).</target>'));
});
