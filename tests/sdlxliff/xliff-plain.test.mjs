// Plain XLIFF 1.2 (.xlf / .xliff, no <mrk mtype="seg">, no <sdl:seg>): same
// reader and writer as SDLXLIFF. The shapes come from the client's real files
// (test/xlf): XTM states, Okapi bpt/ept/ph, several <file>s with repeated ids,
// empty and missing targets. node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { DOMParser } from "@xmldom/xmldom";
import { readSdlxliffSegments } from "../../modules/documents/sdlxliff/reader.js";
import { writeSdlxliff } from "../../modules/documents/sdlxliff/writer.js";
import { isSpliceFormat } from "../../lib/splice-formats.js";

const NS = "urn:oasis:names:tc:xliff:document:1.2";
const wrap = (units, extra = "") =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<xliff version="1.2" xmlns="${NS}">\n` +
  `  <file source-language="en" target-language="fr" datatype="plaintext" original="a.txt">\n    <body>\n${units}\n    </body>\n  </file>${extra}\n</xliff>\n`;

const wellFormed = (text) => {
  new DOMParser({ onError: (l, m) => { if (l !== "warning") throw new Error(m); } }).parseFromString(text, "text/xml");
  return true;
};
const tu = (externalId, translatedLiteral, extra = {}) => ({ externalId, translatedLiteral, Status: "TRANSLATED_MT", ...extra });

test("extensiones: xlf y xliff van por el mismo camino que sdlxliff (sin Tikal)", () => {
  for (const ext of ["sdlxliff", "xlf", "xliff", ".XLF", "Xliff"]) assert.equal(isSpliceFormat(ext), true, ext);
  for (const ext of ["docx", "txt", "po", "", undefined]) assert.equal(isSpliceFormat(ext), false, String(ext));
});

test("lector: la unidad es el segmento; bloqueados y 'sin traducir' por estado", () => {
  const raw = wrap(
    `      <trans-unit id="a"><source>Open</source><target state="signed-off">Ouvrir</target></trans-unit>\n` +
      `      <trans-unit id="b" approved="yes"><source>Close</source><target>Fermer</target></trans-unit>\n` +
      `      <trans-unit id="c"><source>Save</source><target state="translated">Enregistrer</target></trans-unit>\n` +
      `      <trans-unit id="d"><source>Print</source><target state="needs-translation">Print</target></trans-unit>\n` +
      `      <trans-unit id="e"><source>Edit</source><target/></trans-unit>\n` +
      `      <trans-unit id="f"><source>Exit</source></trans-unit>\n` +
      `      <trans-unit id="g" translate="no"><source>SKU-1</source></trans-unit>`,
  );
  const by = Object.fromEntries(readSdlxliffSegments(raw).segments.map((s) => [s.transUnitId, s]));
  assert.deepEqual(Object.keys(by), ["a", "b", "c", "d", "e", "f"], "translate=no no se importa");
  assert.equal(by.a.locked, true, "state signed-off = del cliente");
  assert.equal(by.b.locked, true, "approved=yes = del cliente");
  assert.equal(by.c.locked, false);
  assert.equal(by.c.target, "Enregistrer", "traducido por el cliente: se conserva");
  assert.equal(by.d.target, null, "needs-translation: el target es un relleno, cuenta como vacio");
  assert.equal(by.e.target, null);
  assert.equal(by.f.target, null);
  assert.equal(by.e.mid, null);
});

test("escritor: rellena <target/>, crea el que falta con su sangria y pone el estado", () => {
  const raw = wrap(
    `      <trans-unit id="1">\n        <source>Open</source>\n        <target/>\n      </trans-unit>\n` +
      `      <trans-unit id="2">\n        <source>Close</source>\n      </trans-unit>`,
  );
  const { text, report } = writeSdlxliff(raw, [tu("1", "Ouvrir"), tu("2", "Fermer")]);
  assert.equal(report.written, 2);
  assert.equal(report.targetCreated, 1);
  assert.match(text, /<target state="needs-review-translation">Ouvrir<\/target>/);
  assert.match(text, /<source>Close<\/source>\n {8}<target state="needs-review-translation">Fermer<\/target>/);
  assert.equal(wellFormed(text), true);
  // Fuera de los targets, el fichero es el mismo byte a byte.
  assert.equal(
    text.replace(/<target state="[^"]*">[^<]*<\/target>\n? *|<target\/>/g, "").replace(/\s+/g, ""),
    raw.replace(/<target\/>/g, "").replace(/\s+/g, ""),
  );
});

test("escritor: la traduccion del cliente no se pisa; revisada solo cambia su estado", () => {
  const raw = wrap(
    `      <trans-unit id="1"><source>Save</source><target state="translated">Enregistrer</target></trans-unit>\n` +
      `      <trans-unit id="2"><source>Open</source><target state="translated">Ouvrir</target></trans-unit>`,
  );
  const mine = [
    tu("1", "OTRA", { translatedLiteral: "Enregistrer" }), // no la toca nadie
    tu("2", "Ouvrir", { reviewLiteral: "Ouvrir", Status: "ACCEPTED" }), // la aprueba un revisor
  ];
  const { text, report } = writeSdlxliff(raw, mine);
  assert.equal(report.written, 0);
  assert.equal(report.unchanged, 2, "el texto no cambio en ninguno de los dos");
  assert.equal(report.confirmed, 1);
  assert.match(text, /<target state="translated">Enregistrer<\/target>/, "intacta");
  assert.match(text, /<target state="signed-off">Ouvrir<\/target>/, "solo cambia el estado");
});

test("escritor: bloqueados (signed-off) no se tocan", () => {
  const raw = wrap(`      <trans-unit id="1"><source>Save</source><target state="signed-off">Enregistrer</target></trans-unit>`);
  const { text, report } = writeSdlxliff(raw, [tu("1", "XXX", { blockReason: "INTERNAL" })]);
  assert.equal(report.skippedLocked, 1);
  assert.equal(text, raw);
});

test("escritor: etiquetas Okapi (bpt/ept/ph) y <g> se copian del origen; otro orden no se escribe", () => {
  const raw = wrap(
    `      <trans-unit id="1"><source>Press <g id="1">Start</g> and <ph id="2">&lt;xref id="9"/&gt;</ph> now</source><target/></trans-unit>\n` +
      `      <trans-unit id="2"><source>Use <bpt id="3" ctype="x-unit">&lt;unit&gt;</bpt>5 V<ept id="3">&lt;/unit&gt;</ept> now</source><target/></trans-unit>`,
  );
  const segs = readSdlxliffSegments(raw).segments;
  assert.equal(segs[0].source, "Press <g1>Start</g1> and <x2/> now");
  assert.equal(segs[1].source, "Use <b3/>5 V<e3/> now");
  assert.equal(segs[1].tagInfo.b3.name, "unit", "el tipo sale del ctype");
  assert.equal(segs[0].tagInfo.x2.name, "xref", "o del codigo original del <ph>");

  const ok = writeSdlxliff(raw, [tu("1", "Appuyez sur <g1>Start</g1> et <x2/> maintenant"), tu("2", "Utilisez <b3/>5 V<e3/> maintenant")]);
  assert.equal(ok.report.written, 2);
  assert.match(ok.text, /<target state="needs-review-translation">Appuyez sur <g id="1">Start<\/g> et <ph id="2">&lt;xref id="9"\/&gt;<\/ph> maintenant<\/target>/);
  assert.match(ok.text, /<bpt id="3" ctype="x-unit">&lt;unit&gt;<\/bpt>5 V<ept id="3">&lt;\/unit&gt;<\/ept> maintenant<\/target>/);
  assert.equal(wellFormed(ok.text), true);

  const swapped = writeSdlxliff(raw, [tu("1", "et <x2/> Appuyez sur <g1>Start</g1> maintenant")]);
  assert.equal(swapped.report.written, 0);
  assert.equal(swapped.report.skippedTags, 1);
  assert.equal(swapped.text, raw);
});

test("varios <file> con los mismos ids de trans-unit: cada uno recibe lo suyo", () => {
  // 102368_.xliff: ids "0", "1"... repetidos en cada <file>.
  const second =
    `\n  <file source-language="en" target-language="fr" datatype="plaintext" original="b.txt">\n    <body>\n` +
    `      <trans-unit id="1"><source>Second file</source><target/></trans-unit>\n    </body>\n  </file>`;
  const raw = wrap(`      <trans-unit id="1"><source>First file</source><target/></trans-unit>`, second);
  const segs = readSdlxliffSegments(raw).segments;
  assert.deepEqual(segs.map((s) => s.transUnitId), ["0:1", "1:1"]);
  const { text } = writeSdlxliff(raw, [tu("0:1", "Premier"), tu("1:1", "Second")]);
  assert.match(text, /First file<\/source><target state="needs-review-translation">Premier<\/target>/);
  assert.match(text, /Second file<\/source><target state="needs-review-translation">Second<\/target>/);
  // Un solo <file>: la clave sigue siendo el id a secas (documentos ya importados).
  assert.equal(readSdlxliffSegments(wrap(`      <trans-unit id="7"><source>x</source></trans-unit>`)).segments[0].transUnitId, "7");
});

test("UTF-8: CJK, acentos y entidades llegan sin tocar; CRLF y BOM se conservan", () => {
  const raw =
    `﻿` +
    wrap(`      <trans-unit id="1"><source>Cover &amp; back</source><target/></trans-unit>`).replace(/\n/g, "\r\n");
  const { text } = writeSdlxliff(raw, [tu("1", "封面 & é ü — ½")]);
  assert.ok(text.startsWith("﻿"), "BOM");
  assert.match(text, /<target state="needs-review-translation">封面 &amp; é ü — ½<\/target>/);
  assert.equal(text.split("\r\n").length, raw.split("\r\n").length, "CRLF intacto");
  assert.equal(wellFormed(text.replace(/^﻿/, "")), true);
});

test("politica: .sdlxliff, .xlf y .xliff traducen los vacios con DAAIT (decision 2026-10-02)", async () => {
  const { translatesEmptiesOnImport } = await import("../../lib/splice-formats.js");
  for (const ext of ["sdlxliff", "xlf", "xliff", ".XLF", "Xliff"]) assert.equal(translatesEmptiesOnImport(ext), true, ext);
  for (const ext of ["docx", "txt", "po", "", null]) assert.equal(translatesEmptiesOnImport(ext), false, String(ext));
});
