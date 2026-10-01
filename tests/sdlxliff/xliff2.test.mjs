// XLIFF 2.x: the <segment> is the unit of work, the state is an attribute of
// <segment>, inline codes are pc/ph/sc/ec/sm/em/mrk/cp and point to
// <originalData>. Same reader/writer as 1.2 and SDLXLIFF.
// node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { DOMParser } from "@xmldom/xmldom";
import { readSdlxliffSegments } from "../../modules/documents/sdlxliff/reader.js";
import { writeSdlxliff } from "../../modules/documents/sdlxliff/writer.js";
import { tagIssue } from "../../modules/documents/tag-check.js";

const NS = "urn:oasis:names:tc:xliff:document:2.0";
const doc = (files) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<xliff version="2.0" xmlns="${NS}" srcLang="en-GB" trgLang="fr">\n${files}</xliff>\n`;
const file = (units, attrs = ' id="f1"') => `  <file${attrs}>\n${units}  </file>\n`;
const wellFormed = (text) => {
  new DOMParser({ onError: (l, m) => { if (l !== "warning") throw new Error(m); } }).parseFromString(text, "text/xml");
  return true;
};
const tu = (externalId, translatedLiteral, extra = {}) => ({ externalId, translatedLiteral, Status: "TRANSLATED_MT", ...extra });

test("2.x: idiomas de la raiz, segmentos de cada unit, ignorable fuera y translate heredado", () => {
  const raw = doc(
    file(
      `    <unit id="u1">\n      <segment id="s1"><source>One.</source></segment>\n      <ignorable><source> </source></ignorable>\n      <segment id="s2"><source>Two.</source><target>Dos.</target></segment>\n    </unit>\n` +
        `    <group id="g1" translate="no">\n      <unit id="u2"><segment><source>SKU-1</source></segment></unit>\n    </group>\n` +
        `    <unit id="u3" translate="no"><segment><source>CODE</source></segment></unit>\n` +
        `    <unit id="u4"><segment><source>Open</source></segment><segment><source>Close</source></segment></unit>\n`,
    ),
  );
  const r = readSdlxliffSegments(raw);
  assert.equal(r.sourceLanguage, "en-GB");
  assert.equal(r.targetLanguage, "fr");
  assert.deepEqual(
    r.segments.map((s) => s.transUnitId),
    ["u1|s1", "u1|s2", "u4|#0", "u4|#1"],
    "translate=no (grupo y unit) fuera; sin id de segmento: la posicion",
  );
  assert.equal(r.segments[1].target, "Dos.");
  assert.equal(r.segments[0].target, null);
});

test("2.x: estados del segmento — reviewed/final son del cliente, initial es relleno", () => {
  const raw = doc(
    file(
      `    <unit id="a"><segment state="reviewed"><source>A</source><target>A-fr</target></segment></unit>\n` +
        `    <unit id="b"><segment state="final"><source>B</source><target>B-fr</target></segment></unit>\n` +
        `    <unit id="c"><segment state="translated"><source>C</source><target>C-fr</target></segment></unit>\n` +
        `    <unit id="d"><segment state="initial"><source>D</source><target>D</target></segment></unit>\n` +
        `    <unit id="e"><segment><source>E</source><target>E-fr</target></segment></unit>\n`,
    ),
  );
  const by = Object.fromEntries(readSdlxliffSegments(raw).segments.map((s) => [s.transUnitId.split("|")[0], s]));
  assert.equal(by.a.locked, true);
  assert.equal(by.b.locked, true);
  assert.equal(by.c.locked, false);
  assert.equal(by.c.target, "C-fr");
  assert.equal(by.d.target, null, "initial + target = relleno: se traduce");
  assert.equal(by.e.target, "E-fr", "sin estado y con target: traduccion del cliente");
  assert.equal(by.e.locked, false);
});

test("2.x: codigos inline -> marcadores, y el tipo/codigo salen de type, subType y originalData", () => {
  const raw = doc(
    file(
      `    <unit id="u1">\n      <originalData>\n        <data id="d1">&lt;b&gt;</data>\n        <data id="d2">&lt;/b&gt;</data>\n        <data id="d3">&lt;br/&gt;</data>\n      </originalData>\n` +
        `      <segment><source>Press <pc id="1" type="fmt" subType="xlf:b" dataRefStart="d1" dataRefEnd="d2">Start</pc> then<ph id="2" type="fmt" subType="xlf:lb" dataRef="d3"/>go <sc id="3" type="ui"/>menu<ec startRef="3" type="ui"/> and <mrk id="m1" type="term">term</mrk> <sm id="4" type="comment" value="x"/>note<em startRef="4"/>.</source></segment>\n    </unit>\n`,
    ),
  );
  const [seg] = readSdlxliffSegments(raw).segments;
  assert.equal(seg.source, "Press <g1>Start</g1> then<x2/>go <b3/>menu<e3/> and <g1>term</g1> <b4/>note<e4/>.".replace("<g1>term</g1>", "<g2>term</g2>"));
  assert.equal(seg.tagInfo.g1.name, "b", "subType xlf:b -> b");
  assert.equal(seg.tagInfo.g1.detail, "<b>");
  assert.equal(seg.tagInfo.g1.close, "</b>");
  assert.equal(seg.tagInfo.x2.name, "lb");
  assert.equal(seg.tagInfo.x2.detail, "<br/>");
  assert.equal(seg.tagInfo.b3.name, "ui", "sin subType: type");
});

test("escritor 2.x: rellena, crea el <target> con su sangria y pone el estado en <segment>", () => {
  const raw = doc(
    file(
      `    <unit id="u1">\n      <segment id="s1">\n        <source>Open</source>\n        <target/>\n      </segment>\n    </unit>\n` +
        `    <unit id="u2">\n      <segment id="s1">\n        <source>Close</source>\n      </segment>\n    </unit>\n`,
    ),
  );
  const { text, report } = writeSdlxliff(raw, [tu("u1|s1", "Ouvrir"), tu("u2|s1", "Fermer")]);
  assert.equal(report.written, 2);
  assert.equal(report.targetCreated, 1);
  assert.match(text, /<segment id="s1" state="translated">\n {8}<source>Open<\/source>\n {8}<target>Ouvrir<\/target>/);
  assert.match(text, /<source>Close<\/source>\n {8}<target>Fermer<\/target>/, "el target no lleva state (es del segmento)");
  assert.doesNotMatch(text, /<target state=/);
  assert.equal(wellFormed(text), true);
});

test("escritor 2.x: la traduccion del cliente no se pisa; revisada solo cambia el state del segmento", () => {
  const raw = doc(
    file(
      `    <unit id="a"><segment state="translated"><source>Save</source><target>Enregistrer</target></segment></unit>\n` +
        `    <unit id="b"><segment state="translated"><source>Open</source><target>Ouvrir</target></segment></unit>\n` +
        `    <unit id="c"><segment state="reviewed"><source>Exit</source><target>Quitter</target></segment></unit>\n`,
    ),
  );
  const { text, report } = writeSdlxliff(raw, [
    tu("a|#0", "Enregistrer"), // nadie la toca
    tu("b|#0", "Ouvrir", { reviewLiteral: "Ouvrir", Status: "ACCEPTED" }), // la aprueba un revisor
    tu("c|#0", "XXX", { blockReason: "INTERNAL" }), // bloqueada
  ]);
  assert.equal(report.written, 0);
  assert.equal(report.skippedLocked, 1);
  assert.match(text, /<segment state="translated"><source>Save<\/source><target>Enregistrer<\/target>/, "intacta");
  assert.match(text, /<segment state="reviewed"><source>Open<\/source>/, "aprobada: reviewed");
  assert.match(text, /<segment state="reviewed"><source>Exit<\/source><target>Quitter<\/target>/, "bloqueada: igual");
});

test("escritor 2.x: pc/ph/sc/ec se copian del origen con su originalData; otro orden no se escribe", () => {
  const raw = doc(
    file(
      `    <unit id="u1">\n      <originalData><data id="d1">&lt;b&gt;</data><data id="d2">&lt;/b&gt;</data></originalData>\n` +
        `      <segment><source>Press <pc id="1" dataRefStart="d1" dataRefEnd="d2">Start</pc> and <ph id="2"/> now</source></segment>\n    </unit>\n`,
    ),
  );
  const [seg] = readSdlxliffSegments(raw).segments;
  assert.equal(seg.source, "Press <g1>Start</g1> and <x2/> now");
  const ok = writeSdlxliff(raw, [tu("u1|#0", "Appuyez sur <g1>Start</g1> et <x2/> maintenant")]);
  assert.equal(ok.report.written, 1);
  assert.match(ok.text, /<target>Appuyez sur <pc id="1" dataRefStart="d1" dataRefEnd="d2">Start<\/pc> et <ph id="2"\/> maintenant<\/target>/);
  assert.equal(wellFormed(ok.text), true);
  assert.equal(tagIssue(seg.source, "et <x2/> <g1>Start</g1>", { ordered: true }).ok, false);
  const swapped = writeSdlxliff(raw, [tu("u1|#0", "et <x2/> Appuyez sur <g1>Start</g1> maintenant")]);
  assert.equal(swapped.report.skippedTags, 1);
  assert.equal(swapped.text, raw);
});

test("2.x: <ignorable>, <notes> y todo lo demas quedan byte a byte; varios <file> con los mismos ids", () => {
  const f = (name) =>
    file(
      `    <notes><note id="n1">keep me</note></notes>\n    <unit id="1">\n      <segment><source>Hello ${name}</source></segment>\n      <ignorable><source>  </source></ignorable>\n    </unit>\n`,
      ` id="${name}"`,
    );
  const raw = doc(f("a") + f("b"));
  const segs = readSdlxliffSegments(raw).segments;
  assert.deepEqual(segs.map((s) => s.transUnitId), ["0:1|#0", "1:1|#0"]);
  const { text } = writeSdlxliff(raw, [tu("0:1|#0", "Bonjour a"), tu("1:1|#0", "Bonjour b")]);
  assert.equal(
    text.replace(/<target>[^<]*<\/target>\n? */g, "").replace(/ state="translated"/g, ""),
    raw,
    "fuera de target y state, igual",
  );
  // El <source> va en la misma linea que <segment>: no hay sangria que copiar.
  assert.match(text, /Hello a<\/source><target>Bonjour a<\/target>/);
  assert.match(text, /Hello b<\/source><target>Bonjour b<\/target>/);
});

test("2.x: CJK y entidades llegan intactos; BOM y CRLF se conservan", () => {
  const raw =
    "﻿" +
    doc(file(`    <unit id="u1"><segment><source>Cover &amp; back</source><target/></segment></unit>\n`)).replace(/\n/g, "\r\n");
  const { text } = writeSdlxliff(raw, [tu("u1|#0", "封面 & é ü")]);
  assert.ok(text.startsWith("﻿"));
  assert.match(text, /<target>封面 &amp; é ü<\/target>/);
  assert.equal(text.split("\r\n").length, raw.split("\r\n").length);
  assert.equal(wellFormed(text.replace(/^﻿/, "")), true);
});
