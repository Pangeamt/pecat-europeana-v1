// SDLXLIFF / XLIFF (2026-11-11): the target's tags may come in ANY order --
// some languages need to move them -- as long as they are the source's tags and
// still nest (no crossed pairs, a start code before its end). The editor, the
// save, the import and the export use the same check (tag-check.js).
// node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { DOMParser } from "@xmldom/xmldom";
import { describeTagIssue, tagIssue } from "../../modules/documents/tag-check.js";
import { readSdlxliffSegments } from "../../modules/documents/sdlxliff/reader.js";
import { invariants, writeSdlxliff } from "../../modules/documents/sdlxliff/writer.js";

const strict = (source, target) => tagIssue(source, target, { ordered: true });
const wellFormed = (text) => {
  new DOMParser({ onError: (l, m) => { if (l !== "warning") throw new Error(m); } }).parseFromString(text, "text/xml");
  return true;
};

test("regla: otro orden pasa, también sacando una pareja de dentro de otra", () => {
  const src = "Only machine<g5>MD</g5>-approved parts with ne<g6>o</g6>s<x7/>.";
  assert.equal(strict(src, "Με το ne<g6>o</g6>s<x7/> μόνο από τη machine<g5>MD</g5>.").ok, true);
  assert.equal(strict(src, "<x7/>ne<g6>o</g6>s, machine<g5>MD</g5>").ok, true);
  const nested = "A <g1>bold <g2>link</g2></g1> c";
  assert.equal(strict(nested, "<g2>link</g2> A <g1>bold</g1> c").ok, true, "g2 sale de g1: sigue siendo un árbol");
  assert.equal(strict(nested, "<g2>A <g1>bold</g1></g2> c").ok, true, "g1 dentro de g2");
});

test("regla: una pareja cruzada, un cierre antes de su apertura o un final antes de su inicio = error", () => {
  const nested = "A <g1>bold</g1> <g2>link</g2> c";
  const crossed = strict(nested, "A <g1>bold <g2>link</g1></g2> c");
  assert.equal(crossed.ok, false);
  assert.equal(crossed.crossed, "</g1> closes while <g2> is still open");
  assert.match(describeTagIssue(crossed), /^crossed tags: <\/g1> closes while <g2> is still open$/);
  assert.equal(strict(nested, "A </g1>bold<g1> <g2>link</g2> c").crossed, "</g1> comes before its <g1>");
  const code = "Use <b3/>5 V<e3/> now";
  assert.equal(strict(code, "Utilisez <e3/>5 V<b3/>").crossed, "<e3/> comes before its <b3/>");
  assert.equal(strict(code, "Utilisez maintenant <b3/>5 V<e3/>").ok, true, "la pareja b/e se mueve entera");
  // Un <bN/> o <eN/> sin su pareja en el segmento (bx/ex, it) va donde quiera.
  assert.equal(strict("<b4/>A <x1/> B", "B <x1/> A<b4/>").ok, true);
});

test("regla: faltar, sobrar o repetir sigue siendo error en todos los formatos", () => {
  const src = "A <g1>b</g1> <x2/> c";
  for (const ordered of [true, false]) {
    assert.deepEqual(tagIssue(src, "<x2/> A b c", { ordered }).missing, ["<g1>", "</g1>"]);
    assert.deepEqual(tagIssue(src, "<x2/> A <g1>b</g1> <x9/>", { ordered }).extra, ["<x9/>"]);
    assert.deepEqual(tagIssue(src, "<x2/> A <g1>b</g1> <x2/>", { ordered }).extra, ["<x2/>"], "duplicada");
  }
  // Sin orden (docx, xlsx… por Okapi): solo el conjunto, como antes.
  assert.equal(tagIssue(src, "A </g1>b<g1> <x2/> c").ok, true);
});

test("regla: un origen que no es un árbol (pareja partida entre frases) conserva su orden exacto", () => {
  const half = "<g1>First <x2/> one.";
  assert.equal(strict(half, "<g1>Premier <x2/> un.").ok, true);
  const moved = strict(half, "<x2/> <g1>Premier un.");
  assert.equal(moved.ok, false);
  assert.deepEqual(moved.order, { expected: ["<g1>", "<x2/>"], got: ["<x2/>", "<g1>"] });
  assert.match(describeTagIssue(moved), /wrong order/);
});

// The case of the Greek manual (EL V2 #197), with test data: the translation
// puts "neos" before "machineMD".
const SDL = "http://sdl.com/FileTypes/SdlXliff/1.0";
const X = "urn:oasis:names:tc:xliff:document:1.2";
const GREEK = [
  `<?xml version="1.0" encoding="utf-8"?><xliff xmlns:sdl="${SDL}" xmlns="${X}" version="1.2" sdl:version="1.0">`,
  `<file original="manual.docx" source-language="en-US" target-language="el-GR" datatype="x-sdlfilterframework2"><body>`,
  `<trans-unit id="t1"><source>Only machine<g id="5">MD</g>-approved parts may be used with ne<g id="6">o</g>s.</source>`,
  `<seg-source><mrk mtype="seg" mid="1">Only machine<g id="5">MD</g>-approved parts may be used with ne<g id="6">o</g>s.</mrk></seg-source>`,
  `<target><mrk mtype="seg" mid="1"/></target><sdl:seg-defs><sdl:seg id="1"/></sdl:seg-defs></trans-unit>`,
  `</body></file></xliff>`,
].join("\r\n");
const GREEK_TARGET = (k, o) =>
  `Με το ne<g${o}>o</g${o}>s επιτρέπονται μόνο εξαρτήματα εγκεκριμένα από τη machine<g${k}>MD</g${k}>.`;

test("escritor: el caso griego (neos antes que machineMD) se escribe, bien formado", () => {
  const [s] = readSdlxliffSegments(GREEK).segments;
  const k = s.source.match(/<g(\d+)>MD/)[1];
  const o = s.source.match(/<g(\d+)>o</)[1];
  const target = GREEK_TARGET(k, o);
  assert.equal(strict(s.source, target).ok, true);
  const tu = { externalId: `${s.transUnitId}::${s.mid}`, srcLiteral: s.source, reviewLiteral: target, Status: "EDITED" };
  const { text, report } = writeSdlxliff(GREEK, [tu]);
  assert.equal(report.written, 1);
  assert.equal(report.skippedTags, 0);
  assert.match(
    text,
    /<target><mrk mtype="seg" mid="1">Με το ne<g id="6">o<\/g>s επιτρέπονται μόνο εξαρτήματα εγκεκριμένα από τη machine<g id="5">MD<\/g>\.<\/mrk><\/target>/,
  );
  assert.equal(wellFormed(text), true);
  assert.deepEqual(invariants(text), invariants(GREEK));
  // Y el mismo segmento con las parejas cruzadas no sale.
  const crossed = writeSdlxliff(GREEK, [{ ...tu, reviewLiteral: `Με το ne<g${o}>o machine<g${k}>MD</g${o}>s</g${k}>.` }]);
  assert.equal(crossed.report.skippedTags, 1);
  assert.equal(crossed.text, GREEK);
});

test("escritor: al mover dos contenidos bloqueados, cada uno conserva SU lockTU del destino", () => {
  const raw = [
    `<?xml version="1.0" encoding="utf-8"?><xliff xmlns:sdl="${SDL}" xmlns="${X}" version="1.2" sdl:version="1.0">`,
    `<file original="a.docx" source-language="en-US" target-language="el-GR" datatype="x-sdlfilterframework2"><body>`,
    `<trans-unit id="t1"><source>Use <x id="L1" xid="lockTU_s1"/> with <x id="L2" xid="lockTU_s2"/>.</source>`,
    `<seg-source><mrk mtype="seg" mid="1">Use <x id="L1" xid="lockTU_s1"/> with <x id="L2" xid="lockTU_s2"/>.</mrk></seg-source>`,
    `<target><mrk mtype="seg" mid="1">Use <x id="L1" xid="lockTU_t1"/> with <x id="L2" xid="lockTU_t2"/>.</mrk></target>`,
    `<sdl:seg-defs><sdl:seg id="1"/></sdl:seg-defs></trans-unit>`,
    `<trans-unit id="lockTU_s1" translate="no"><source>AAA</source></trans-unit>`,
    `<trans-unit id="lockTU_s2" translate="no"><source>BBB</source></trans-unit>`,
    `<trans-unit id="lockTU_t1" translate="no"><source>AAA</source></trans-unit>`,
    `<trans-unit id="lockTU_t2" translate="no"><source>BBB</source></trans-unit>`,
    `</body></file></xliff>`,
  ].join("\r\n");
  const [s] = readSdlxliffSegments(raw).segments;
  const [first, second] = s.source.match(/<x\d+\/>/g);
  const tu = { externalId: "t1::1", srcLiteral: s.source, reviewLiteral: `Με ${second} και ${first}.`, Status: "EDITED" };
  const { text, report } = writeSdlxliff(raw, [tu]);
  assert.equal(report.written, 1);
  assert.match(text, /<target><mrk mtype="seg" mid="1">Με <x id="L2" xid="lockTU_t2"\/> και <x id="L1" xid="lockTU_t1"\/>\.<\/mrk><\/target>/);
  assert.equal(report.lockTuCloned, 0);
  assert.deepEqual(invariants(text), invariants(raw));
});

test("escritor (XLIFF sin segmentar): una frase con sus etiquetas en otro orden se escribe en su unidad", () => {
  const NS = "urn:oasis:names:tc:xliff:document:1.2";
  const raw =
    `<?xml version="1.0" encoding="UTF-8"?>\n<xliff version="1.2" xmlns="${NS}">\n` +
    `  <file source-language="en-GB" target-language="el-GR" datatype="xml" original="a">\n    <body>\n` +
    `      <trans-unit id="b"><source>Press <g id="1">Start</g> and <x id="2"/> now. Second one.</source><target/></trans-unit>\n` +
    `    </body>\n  </file>\n</xliff>\n`;
  const segs = readSdlxliffSegments(raw).segments;
  assert.deepEqual(segs.map((s) => s.source), ["Press <g1>Start</g1> and <x2/> now.", "Second one."]);
  const tus = segs.map((s, i) => ({
    externalId: `${s.transUnitId}::${s.mid}`,
    srcLiteral: s.source,
    translatedLiteral: i === 0 ? "Πατήστε <x2/> και <g1>Έναρξη</g1> τώρα." : "Δεύτερο.",
    Status: "TRANSLATED_MT",
  }));
  const { text, report } = writeSdlxliff(raw, tus);
  assert.equal(report.skippedTags, 0);
  assert.equal(report.written, 2);
  assert.match(text, /<target[^>]*>Πατήστε <x id="2"\/> και <g id="1">Έναρξη<\/g> τώρα\. Δεύτερο\.<\/target>/);
  assert.equal(wellFormed(text), true);
});
