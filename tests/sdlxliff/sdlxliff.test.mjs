// node --test tests/  (no dependencies: node:test + node:assert)
//
// Shapes taken from real Trados files (the fr-FR corpus): BOM + CRLF, <g>
// wrapping the seg mrk, lockTU references with a separate definition per
// side, self-closing empty target mrks, a nested x-sdl-location mrk.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readSdlxliffSegments } from "../../modules/documents/sdlxliff/reader.js";
import { invariants, writeSdlxliff } from "../../modules/documents/sdlxliff/writer.js";

const BOM = "﻿";
const X = "urn:oasis:names:tc:xliff:document:1.2";
const SDL = "http://sdl.com/FileTypes/SdlXliff/1.0";

const FILE = [
  `${BOM}<?xml version="1.0" encoding="utf-8"?><xliff xmlns:sdl="${SDL}" xmlns="${X}" version="1.2" sdl:version="1.0">`,
  `<file original="a.docx" source-language="en-US" target-language="fr-FR" datatype="x-sdlfilterframework2"><body>`,
  // t1: tag + lockTU, target empty (self-closing mrk), open
  `<trans-unit id="t1"><source>Pressure pipe <x id="locked5" xid="lockTU_src"/> 1</source>`,
  `<seg-source><mrk mtype="seg" mid="1">Pressure pipe <x id="locked5" xid="lockTU_seg"/> 1</mrk></seg-source>`,
  `<target><mrk mtype="seg" mid="1"/></target>`,
  `<sdl:seg-defs><sdl:seg id="1"/></sdl:seg-defs></trans-unit>`,
  `<trans-unit id="lockTU_src" translate="no"><source>X</source></trans-unit>`,
  `<trans-unit id="lockTU_seg" translate="no"><source>X</source></trans-unit>`,
  // t2: <g> around the mrk, client translation, open, &quot; entity
  `<trans-unit id="t2"><source><g id="7">Say &quot;hi&quot; <g id="8">now</g></g></source>`,
  `<seg-source><g id="7"><mrk mtype="seg" mid="2">Say &quot;hi&quot; <g id="8">now</g></mrk></g></seg-source>`,
  `<target><g id="7"><mrk mtype="seg" mid="2">Dites &quot;salut&quot; <g id="8">maintenant</g></mrk></g></target>`,
  `<sdl:seg-defs><sdl:seg id="2" conf="ApprovedTranslation" origin="interactive"/></sdl:seg-defs></trans-unit>`,
  // t3: locked
  `<trans-unit id="t3"><source>Locked</source><seg-source><mrk mtype="seg" mid="3">Locked</mrk></seg-source>`,
  `<target><mrk mtype="seg" mid="3">Verrouillé</mrk></target>`,
  `<sdl:seg-defs><sdl:seg id="3" locked="true" conf="Translated"/></sdl:seg-defs></trans-unit>`,
  // t4: NBSP inside, nested x-sdl-location, leading space in seg-source
  `<trans-unit id="t4"><source> A : b</source><seg-source><mrk mtype="seg" mid="4"> A : <mrk mtype="x-sdl-location" mid="l1"/>b</mrk></seg-source>`,
  `<target><mrk mtype="seg" mid="4"/></target>`,
  `<sdl:seg-defs><sdl:seg id="4"/></sdl:seg-defs></trans-unit>`,
  `</body></file></xliff>`,
].join("\r\n");

const seg = (segments, id) => segments.find((s) => `${s.transUnitId}::${s.mid}` === id);

test("lector: etiquetas como marcadores, bloqueados, NBSP y translate=no", () => {
  const { sourceLanguage, targetLanguage, segments } = readSdlxliffSegments(FILE);
  assert.equal(sourceLanguage, "en-US");
  assert.equal(targetLanguage, "fr-FR");
  assert.deepEqual(segments.map((s) => `${s.transUnitId}::${s.mid}`), ["t1::1", "t2::2", "t3::3", "t4::4"]);
  assert.equal(seg(segments, "t1::1").source, "Pressure pipe <x1/> 1");
  assert.equal(seg(segments, "t1::1").target, null);
  assert.equal(seg(segments, "t2::2").source, 'Say "hi" <g8>now</g8>');
  assert.equal(seg(segments, "t2::2").target, 'Dites "salut" <g8>maintenant</g8>');
  assert.equal(seg(segments, "t3::3").locked, true);
  assert.equal(seg(segments, "t4::4").source, "A : <x1/>b", "NBSP y la marca anidada se conservan");
});

test("escritor: sin cambios el fichero sale IDENTICO byte a byte", () => {
  const { segments } = readSdlxliffSegments(FILE);
  const tus = segments.map((s) => ({
    externalId: `${s.transUnitId}::${s.mid}`,
    translatedLiteral: s.target,
    Status: "NOT_REVIEWED",
  }));
  const { text, report } = writeSdlxliff(FILE, tus);
  assert.equal(text, FILE);
  assert.equal(report.written, 0);
});

test("escritor: la edicion con marca vuelve con la etiqueta REAL y su propio lockTU", () => {
  const tus = [{ externalId: "t1::1", reviewLiteral: "Tuyau de pression <x1/> 1", Status: "EDITED" }];
  const { text, report } = writeSdlxliff(FILE, tus);
  assert.equal(report.written, 1);
  assert.equal(report.lockTuCloned, 1);
  const target = /<target><mrk mtype="seg" mid="1">(.*?)<\/mrk><\/target>/.exec(text)[1];
  assert.match(target, /^Tuyau de pression <x id="locked5" xid="lockTU_[0-9a-f-]{36}"\/> 1$/);
  assert.ok(!target.includes("lockTU_seg"), "el destino NO comparte el lockTU del seg-source");
  assert.match(text, /<sdl:seg id="1" conf="ApprovedTranslation" origin="interactive"\/>/);
  assert.deepEqual(invariants(text), invariants(FILE));
  assert.ok(text.startsWith(BOM) && text.includes("\r\n"), "BOM y CRLF intactos");
});

test("escritor: <g> anidado, comillas escapadas al estilo Trados y MT = Draft", () => {
  const tus = [{ externalId: "t2::2", translatedLiteral: 'Dis "hola" <g8>ya</g8>', Status: "TRANSLATED_MT" }];
  const { text } = writeSdlxliff(FILE, tus);
  assert.ok(text.includes('<mrk mtype="seg" mid="2">Dis &quot;hola&quot; <g id="8">ya</g></mrk>'));
  assert.match(text, /<sdl:seg id="2" conf="Draft" origin="mt"\/>/);
});

test("escritor: lo del cliente sin tocar NO se reconfirma, y lo bloqueado nunca se toca", () => {
  const tus = [
    { externalId: "t2::2", translatedLiteral: 'Dites "salut" <g8>maintenant</g8>', Status: "TRANSLATED_MT" },
    { externalId: "t3::3", reviewLiteral: "Otra cosa", Status: "EDITED" },
  ];
  const { text, report } = writeSdlxliff(FILE, tus);
  assert.equal(text, FILE);
  assert.equal(report.unchanged, 1);
  assert.equal(report.skippedLocked, 1);
});

test("escritor: documento antiguo sin marcadores -> no se escribe y se cuenta", () => {
  const tus = [{ externalId: "t1::1", reviewLiteral: "Tuyau de pression 1", Status: "EDITED" }];
  const { text, report } = writeSdlxliff(FILE, tus);
  assert.equal(text, FILE);
  assert.equal(report.skippedLegacy, 1);
});

test("escritor: etiquetas en otro orden o sobrantes -> no se escribe", () => {
  const tus = [{ externalId: "t2::2", reviewLiteral: 'Dis <g8>ya</g8> "hola" <x1/>', Status: "EDITED" }];
  const { report } = writeSdlxliff(FILE, tus);
  assert.equal(report.skippedTags, 1);
});

test("escritor: los bordes de espacio salen del seg-source y la marca anidada vuelve", () => {
  const tus = [{ externalId: "t4::4", reviewLiteral: "A : <x1/>b traduit", Status: "EDITED" }];
  const { text } = writeSdlxliff(FILE, tus);
  assert.ok(text.includes('<mrk mtype="seg" mid="4"> A : <mrk mtype="x-sdl-location" mid="l1"/>b traduit</mrk>'));
});

test("escritor: una clave sin sitio en el original se cuenta y no se inventa nada", () => {
  const tus = [{ externalId: "zz::9", reviewLiteral: "x", Status: "EDITED" }];
  const { text, report } = writeSdlxliff(FILE, tus);
  assert.equal(text, FILE);
  assert.equal(report.noPlace, 1);
});
