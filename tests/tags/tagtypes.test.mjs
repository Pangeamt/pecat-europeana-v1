// Tag TYPES (Trados-style chips) and the tag gate: tagInfo from <tag-defs> and
// from Tikal's ctype, the ordered tag check, "Fix tags" and the writer's gate.
// node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { DOMParser } from "@xmldom/xmldom";
import { readSdlxliffSegments } from "../../modules/documents/sdlxliff/reader.js";
import { writeSdlxliff } from "../../modules/documents/sdlxliff/writer.js";
import { describeTagIssue, tagIssue } from "../../modules/documents/tag-check.js";
import { tagInfoFromCodes } from "../../modules/extraction/tag-info.js";
import { fixTags } from "../../components/TagEditor/tag-rules.js";

const SDL = "http://sdl.com/FileTypes/SdlXliff/1.0";

// A client file as Trados writes it: tag-defs in the header (type + original
// code of every inline), a lockTU unit with locked text, and one segment that
// uses all three kinds of inline.
function sdlxliff({ locked = true } = {}) {
  const seg =
    `Connect ${locked ? '<x id="locked1" xid="lockTU_a"/>' : ""} 1 <g id="3">now</g> <x id="164"/> ok.`;
  return (
    `﻿<?xml version="1.0" encoding="utf-8"?>` +
    `<xliff xmlns:sdl="${SDL}" xmlns="urn:oasis:names:tc:xliff:document:1.2" version="1.2" sdl:version="1.0">` +
    `<file original="x.xml" datatype="x-sdlfilterframework2" source-language="en-US" target-language="fr-FR">` +
    `<header><tag-defs xmlns="${SDL}">` +
    `<tag id="3"><bpt name="glossary" word-end="false">&lt;glossary word=&quot;DTC&quot;&gt;</bpt>` +
    `<ept name="glossary" word-end="false">&lt;/glossary&gt;</ept><fmt id="1"/></tag>` +
    `<tag id="164"><ph name="&amp;amp;" equiv-text="amp" seg-hint="IncludeWithText">&amp;amp;</ph></tag>` +
    `<tag id="57"><bpt name="number" word-end="false">&lt;number&gt;</bpt><ept name="number" word-end="false">&lt;/number&gt;</ept></tag>` +
    `</tag-defs></header><body>` +
    `<trans-unit id="lockTU_a" translate="no" sdl:locktype="Manual"><source><g id="57">N 12</g></source></trans-unit>` +
    `<trans-unit id="u1"><source>${seg}</source>` +
    `<seg-source><mrk mtype="seg" mid="1">${seg}</mrk></seg-source>` +
    `<target><mrk mtype="seg" mid="1"/></target>` +
    `<sdl:seg-defs><sdl:seg id="1"/></sdl:seg-defs></trans-unit>` +
    `</body></file></xliff>`
  );
}

test("SDLXLIFF: tagInfo con el tipo y el codigo original de cada etiqueta", () => {
  const [seg] = readSdlxliffSegments(sdlxliff()).segments;
  assert.equal(seg.source, "Connect <x1/> 1 <g3>now</g3> <x164/> ok.");
  // La referencia a contenido bloqueado: tipo de lo que hay dentro + su texto.
  assert.deepEqual(seg.tagInfo.x1, { name: "number", locked: true, lockedText: "N 12" });
  // Un par: el codigo de apertura y el de cierre.
  assert.equal(seg.tagInfo.g3.name, "glossary");
  assert.equal(seg.tagInfo.g3.detail, '<glossary word="DTC">');
  assert.equal(seg.tagInfo.g3.close, "</glossary>");
  // Una entidad: el nombre llega decodificado una vez ("&amp;"), como en Trados.
  assert.deepEqual(seg.tagInfo.x164, { name: "&amp;", detail: "&amp;", equiv: "amp" });
});

test("SDLXLIFF: sin tag-defs no hay tagInfo (las fichas se quedan como hoy)", () => {
  const raw = sdlxliff().replace(/<tag-defs[\s\S]*?<\/tag-defs>/, "");
  const [seg] = readSdlxliffSegments(raw).segments;
  assert.equal(seg.tagInfo?.x164, undefined);
  assert.equal(seg.tagInfo?.g3, undefined);
});

test("Tikal/XLIFF: tipo desde ctype, equiv-text o el nombre del codigo original", () => {
  const doc = new DOMParser().parseFromString(
    `<seg>` +
      `<g id="1" ctype="bold">b</g>` +
      `<x id="2" equiv-text="deg"/>` +
      `<ph id="3">&lt;xref id="9"/&gt;</ph>` +
      `<bpt id="4" ctype="x-glossary">&lt;glossary word="a"&gt;</bpt>` +
      `<x id="5"/>` +
      `</seg>`,
    "text/xml",
  );
  const nodes = [...doc.documentElement.childNodes];
  const codes = new Map(["g1", "x2", "x3", "b4", "x5"].map((key, i) => [key, nodes[i]]));
  const info = tagInfoFromCodes(codes);
  assert.equal(info.g1.name, "bold");
  assert.equal(info.x2.name, "deg"); // sin ctype ni codigo: el equiv-text
  assert.deepEqual(info.x3, { name: "xref", detail: '<xref id="9"/>' });
  assert.equal(info.b4.name, "glossary"); // "x-" fuera
  assert.equal(info.x5, undefined); // tipo desconocido: ficha como hoy
  // Los nombres que Okapi da a sus propios codigos (docx: "run1") no son un tipo.
  const run = new DOMParser().parseFromString(`<seg><bpt id="1">&lt;run1&gt;</bpt></seg>`, "text/xml");
  assert.equal(tagInfoFromCodes(new Map([["b1", run.documentElement.firstChild]])), null);
});

test("tagIssue: falta, sobra y ORDEN (solo cuando se pide)", () => {
  const src = "A <g1>b</g1> <x2/> c";
  assert.equal(tagIssue(src, "A <g1>b</g1> <x2/> c", { ordered: true }).ok, true);
  assert.deepEqual(tagIssue(src, "A <g1>b</g1> c").missing, ["<x2/>"]);
  assert.deepEqual(tagIssue(src, "A <g1>b</g1> <x2/> <x9/> c").extra, ["<x9/>"]);
  const swapped = "A <x2/> <g1>b</g1> c";
  assert.equal(tagIssue(src, swapped).ok, true, "por conjunto, el reorden pasa");
  const strict = tagIssue(src, swapped, { ordered: true });
  assert.equal(strict.ok, false);
  assert.match(describeTagIssue(strict), /wrong order: expected <g1> <\/g1> <x2\/>, got <x2\/> <g1> <\/g1>/);
});

test("fixTags: reordenadas, con faltantes, con sobrantes y vacio -> la secuencia del origen", () => {
  const src = "Pulse <g1>aqui</g1> y <x2/> luego.";
  for (const target of [
    "Click <x2/> here <g1>and</g1> then.", // reordenadas
    "Click here and then.", // faltan todas
    "Click <g1>here</g1> and then.", // falta una
    "Click <x9/> here <x2/> <x2/>", // sobran e inventadas
    "",
  ]) {
    const fixed = fixTags(src, target);
    assert.equal(tagIssue(src, fixed, { ordered: true }).ok, true, `${JSON.stringify(target)} -> ${fixed}`);
  }
  // El texto no cambia: solo se mueven etiquetas.
  assert.equal(
    fixTags(src, "Click <x2/> here <g1>and</g1> then.").replace(/<\/?[gxbe]\d+\/?>/g, "").replace(/ +/g, " "),
    "Click here and then.",
  );
  assert.equal(fixTags("Sin etiquetas", "a <x1/> b"), "a b", "origen sin etiquetas: se quitan las del destino");
});

test("fixTags (propiedad): cualquier destino roto sale con la secuencia del origen", () => {
  let seed = 42;
  const rand = (n) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % n);
  const words = ["uno", "dos", "tres", "cuatro", "cinco", "seis", "siete"];
  const sources = [
    "A <g1>b</g1> c <x2/> d",
    "<g1>Todo</g1> <x2/>",
    "x<x1/>y <g2>z w</g2><x3/>",
    "<x1/><x2/><x3/> fin",
    "uno dos tres cuatro <g5>cinco</g5> <b6/> seis <e6/> siete",
  ];
  for (let i = 0; i < 300; i++) {
    const src = sources[rand(sources.length)];
    const parts = [];
    for (let j = rand(8); j >= 0; j--) {
      parts.push(rand(3) === 0 ? ["<x1/>", "<x2/>", "<g1>", "</g1>", "<x9/>"][rand(5)] : words[rand(words.length)]);
    }
    const target = parts.join(" ");
    const fixed = fixTags(src, target);
    assert.equal(tagIssue(src, fixed, { ordered: true }).ok, true, `${src} | ${target} -> ${fixed}`);
  }
});

test("escritor: etiquetas en otro orden NO se escriben (la puerta), en su orden SI", () => {
  const raw = sdlxliff({ locked: false });
  const mk = (text) => [{ externalId: "u1::1", translatedLiteral: text }];
  const ok = writeSdlxliff(raw, mk("Branchez 1 <g3>maintenant</g3> <x164/> ok."));
  assert.equal(ok.report.written, 1);
  const swapped = writeSdlxliff(raw, mk("Branchez 1 <x164/> <g3>maintenant</g3> ok."));
  assert.equal(swapped.report.written, 0);
  assert.equal(swapped.report.skippedTags, 1);
  assert.equal(swapped.text, raw, "no se escribe nada: el fichero queda igual");
});

test("Okapi numera sus codigos por posicion: el tipo es el nombre sin el numero", () => {
  const doc = new DOMParser().parseFromString(
    `<seg><bpt id="1">&lt;hyperlink2&gt;</bpt><ph id="2">&lt;tags1/&gt;</ph><bpt id="3">&lt;run3&gt;</bpt></seg>`,
    "text/xml",
  );
  const n = [...doc.documentElement.childNodes];
  const info = tagInfoFromCodes(new Map([["b1", n[0]], ["x2", n[1]], ["b3", n[2]]]));
  assert.equal(info.b1.name, "hyperlink");
  assert.equal(info.x2.name, "tags");
  assert.equal(info.b3, undefined, "run3 -> run: generico, no es un tipo");
});
