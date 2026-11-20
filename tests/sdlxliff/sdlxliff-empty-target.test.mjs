// node --test tests/  (no dependencies: node:test + node:assert)
//
// An SDLXLIFF whose <seg-source> IS segmented (<mrk mtype="seg" mid>) but whose
// <target> is empty, self-closed or missing -- the shape of the two
// "UnknownSegments" files of Owners_P_2026_1690_2L (2026-11-20). The writer
// only wrote into target marks that already existed, found none (169 of 169
// `noPlace`) and the original was delivered untranslated. Now the target gets
// the seg-source's marks first, as Studio does, and the normal path fills them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readSdlxliffSegments } from "../../modules/documents/sdlxliff/reader.js";
import { invariants, nothingWritten, writeSdlxliff } from "../../modules/documents/sdlxliff/writer.js";

const X = "urn:oasis:names:tc:xliff:document:1.2";
const SDL = "http://sdl.com/FileTypes/SdlXliff/1.0";

const FILE = [
  `﻿<?xml version="1.0" encoding="utf-8"?><xliff xmlns:sdl="${SDL}" xmlns="${X}" version="1.2" sdl:version="1.0">`,
  `<file original="" datatype="x-sdlfilterframework2" source-language="en-GB" target-language="da-DK"><body>`,
  // u1: one segment, self-closed target (the case of 2026-11-20)
  `<trans-unit id="u1"><source>Press the button.</source><seg-source><mrk mtype="seg" mid="1">Press the button.</mrk></seg-source><target/><sdl:seg-defs><sdl:seg id="1"/></sdl:seg-defs></trans-unit>`,
  // u2: two segments with a space between them, no <target> at all
  `<trans-unit id="u2"><source>Open it. Close it.</source><seg-source><mrk mtype="seg" mid="2">Open it.</mrk> <mrk mtype="seg" mid="3">Close it.</mrk></seg-source><sdl:seg-defs><sdl:seg id="2"/><sdl:seg id="3"/></sdl:seg-defs></trans-unit>`,
  // u3: empty target, but nobody translated it: must stay byte-identical
  `<trans-unit id="u3"><source>Spare.</source><seg-source><mrk mtype="seg" mid="4">Spare.</mrk></seg-source><target/><sdl:seg-defs><sdl:seg id="4"/></sdl:seg-defs></trans-unit>`,
  // u4: a lockTU reference outside the marks: copying it would share it (rule 5)
  `<trans-unit id="u4"><source>Locked <x id="9"/> here.</source><seg-source><x id="9" xid="lockTU_a"/><mrk mtype="seg" mid="5">Here.</mrk></seg-source><target/><sdl:seg-defs><sdl:seg id="5"/></sdl:seg-defs></trans-unit>`,
  `<trans-unit id="lockTU_a" translate="no"><source>X</source></trans-unit>`,
  `</body></file></xliff>`,
].join("\r\n");

const ROWS = {
  "u1::1": { text: "Tryk på knappen.", Status: "ACCEPTED" },
  "u2::2": { text: "Åbn den.", Status: "ACCEPTED" },
  "u2::3": { text: "Luk den.", Status: "TRANSLATED_MT" },
  "u3::4": { text: "", Status: "NOT_REVIEWED" },
  "u4::5": { text: "Her.", Status: "ACCEPTED" },
};

function tus(only = Object.keys(ROWS)) {
  return only.map((externalId) => {
    const { text, Status } = ROWS[externalId];
    return {
      externalId,
      srcLiteral: "",
      translatedLiteral: text || null,
      reviewLiteral: Status === "ACCEPTED" ? text : null,
      Status,
    };
  });
}

const unitOf = (text, id) => new RegExp(`<trans-unit id="${id}">[\\s\\S]*?</trans-unit>`).exec(text)[0];

test("destino vacío o ausente con origen segmentado: se escribe con las marcas del <seg-source>", () => {
  const { text, report } = writeSdlxliff(FILE, tus());
  assert.equal(report.targetSkeleton, 2, "u1 y u2; u3 sin traducción y u4 con lockTU no");
  assert.equal(report.written, 3);
  assert.equal(report.noPlace, 1, "u4 se queda sin sitio, como antes");

  assert.equal(
    unitOf(text, "u1"),
    `<trans-unit id="u1"><source>Press the button.</source><seg-source><mrk mtype="seg" mid="1">Press the button.</mrk></seg-source><target><mrk mtype="seg" mid="1">Tryk på knappen.</mrk></target><sdl:seg-defs><sdl:seg id="1" conf="Translated" origin="mt"/></sdl:seg-defs></trans-unit>`,
  );
  // Sin <target>: se crea justo después del <seg-source>, con el hueco entre marcas.
  assert.match(
    unitOf(text, "u2"),
    /<\/seg-source><target><mrk mtype="seg" mid="2">Åbn den\.<\/mrk> <mrk mtype="seg" mid="3">Luk den\.<\/mrk><\/target><sdl:seg-defs><sdl:seg id="2" conf="Translated" origin="mt"\/><sdl:seg id="3" conf="Draft" origin="mt"\/>/,
  );
  assert.equal(unitOf(text, "u3"), unitOf(FILE, "u3"), "sin traducción no se toca");
  assert.equal(unitOf(text, "u4"), unitOf(FILE, "u4"), "con lockTU fuera de las marcas no se toca");

  // Lo que vuelve a leer PECAT es lo que se escribió; BOM, CRLF e invariantes de Studio intactos.
  const back = new Map(readSdlxliffSegments(text).segments.map((s) => [`${s.transUnitId}::${s.mid}`, s.target]));
  assert.equal(back.get("u1::1"), "Tryk på knappen.");
  assert.equal(back.get("u2::3"), "Luk den.");
  assert.equal(text.charCodeAt(0), 0xfeff);
  assert.equal(text.split("\r\n").length, FILE.split("\r\n").length);
  assert.deepEqual(invariants(text), invariants(FILE));
});

test("si no queda ningún segmento nuestro en el fichero, nothingWritten lo dice", () => {
  // Solo u4 (sin sitio): el fichero saldría tal cual llegó.
  const { text, report } = writeSdlxliff(FILE, tus(["u4::5"]));
  assert.equal(text, FILE);
  assert.equal(report.noPlace, 1);
  assert.equal(nothingWritten(report), true);
  assert.equal(nothingWritten(writeSdlxliff(FILE, tus()).report), false);
  // Nada que escribir (ningún segmento con texto) tampoco es "nada escrito" con pérdida:
  // el servicio solo lo rechaza si además hubo segmentos que no se pudieron escribir.
  const empty = writeSdlxliff(FILE, tus(["u3::4"]));
  assert.equal(empty.text, FILE);
  assert.equal(empty.report.noPlace + empty.report.skippedTags, 0);
});
