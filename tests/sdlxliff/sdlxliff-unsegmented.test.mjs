// node --test tests/  (no dependencies: node:test + node:assert)
//
// An SDLXLIFF that was never segmented in Studio (no <mrk mtype="seg">, no
// <sdl:seg-defs>), the shape of P_2026_1600 (2026-11-03). Studio segments such
// a unit itself only while its target is empty: delivered with the target
// filled and no marks, Trados showed NO segment at all. The writer has to add
// the marks Trados would add.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readSdlxliffSegments } from "../../modules/documents/sdlxliff/reader.js";
import { invariants, writeSdlxliff } from "../../modules/documents/sdlxliff/writer.js";

const X = "urn:oasis:names:tc:xliff:document:1.2";
const SDL = "http://sdl.com/FileTypes/SdlXliff/1.0";

const FILE = [
  `<?xml version="1.0" encoding="utf-8"?><xliff xmlns:sdl="${SDL}" xmlns="${X}" version="1.2" sdl:version="1.0">`,
  `<file original="a.xliff" source-language="en-US" target-language="es-US" datatype="x-sdlfilterframework2"><body>`,
  // u1: one sentence with a <g> pair, empty self-closing target, a comment after it
  `<group><trans-unit id="u1"><source>Earnings from <g id="0"><x id="1"/></g> are down.</source>`,
  `<seg-source>Earnings from <g id="0"><x id="1"/></g> are down.</seg-source><target/><sdl:cmt id="c1"/></trans-unit></group>`,
  // u2: two sentences, no target at all
  `<group><trans-unit id="u2"><source>Link &amp; Code. Keep sharing to earn more!</source>`,
  `<seg-source>Link &amp; Code. Keep sharing to earn more!</seg-source></trans-unit></group>`,
  // u3: empty open/close target
  `<group><trans-unit id="u3"><source>Search back</source><seg-source>Search back</seg-source><target></target></trans-unit></group>`,
  `</body></file></xliff>`,
].join("\n");

const TRANSLATIONS = {
  "u1": "Las ganancias de <g0><x1/></g0> bajaron.",
  "u2::": ["Enlace y código.", "¡Sigue compartiendo para ganar más!"],
  "u3": "Busca de nuevo",
};

function tusFor(file) {
  const { segments } = readSdlxliffSegments(file);
  const sentencesOf = {};
  return segments.map((s) => {
    const externalId = s.mid != null ? `${s.transUnitId}::${s.mid}` : s.transUnitId;
    let text = TRANSLATIONS[externalId];
    if (text === undefined) {
      const list = TRANSLATIONS[`${s.transUnitId}::`];
      sentencesOf[s.transUnitId] = (sentencesOf[s.transUnitId] ?? 0) + 1;
      text = list[sentencesOf[s.transUnitId] - 1];
    }
    return { externalId, srcLiteral: s.source, translatedLiteral: text, reviewLiteral: text, Status: "ACCEPTED" };
  });
}

test("SDLXLIFF sin segmentar: cada frase sale con su <mrk mtype=seg> y su <sdl:seg>", () => {
  const tus = tusFor(FILE);
  assert.equal(tus.length, 4, "u2 se parte en dos frases al importar");
  const { text, report } = writeSdlxliff(FILE, tus);

  assert.equal(report.segmentedForTrados, 4);
  assert.equal(report.written, 4);
  assert.equal(report.noPlace + report.skippedTags + report.skippedIncomplete, 0);

  // Origen y destino con las mismas marcas; ids nuevos en todo el fichero.
  assert.match(text, /<seg-source>Earnings from <mrk mtype="seg" mid="1">|<seg-source><mrk mtype="seg" mid="1">Earnings from <g id="0"><x id="1"\/><\/g> are down\.<\/mrk><\/seg-source>/);
  assert.match(text, /<target><mrk mtype="seg" mid="1">Las ganancias de <g id="0"><x id="1"\/><\/g> bajaron\.<\/mrk><\/target><sdl:seg-defs><sdl:seg id="1" conf="Translated" origin="mt"\/><\/sdl:seg-defs><sdl:cmt id="c1"\/>/);
  assert.match(text, /<seg-source><mrk mtype="seg" mid="2">Link &amp; Code\.<\/mrk> <mrk mtype="seg" mid="3">Keep sharing to earn more!<\/mrk><\/seg-source><target><mrk mtype="seg" mid="2">Enlace y código\.<\/mrk> <mrk mtype="seg" mid="3">¡Sigue compartiendo para ganar más!<\/mrk><\/target><sdl:seg-defs><sdl:seg id="2" conf="Translated" origin="mt"\/><sdl:seg id="3" conf="Translated" origin="mt"\/><\/sdl:seg-defs>/);
  assert.match(text, /<target><mrk mtype="seg" mid="4">Busca de nuevo<\/mrk><\/target><sdl:seg-defs><sdl:seg id="4"/);
  assert.doesNotMatch(text, /state="/, "en SDLXLIFF el estado va en sdl:seg, no en <target state>");
  assert.equal(invariants(text).withoutSeg, 0);

  // Leído otra vez, son segmentos normales de Trados con su traducción.
  const again = readSdlxliffSegments(text).segments;
  assert.deepEqual(
    again.map((s) => [`${s.transUnitId}::${s.mid}`, s.target]),
    [
      ["u1::1", "Las ganancias de <g0><x1/></g0> bajaron."],
      ["u2::2", "Enlace y código."],
      ["u2::3", "¡Sigue compartiendo para ganar más!"],
      ["u3::4", "Busca de nuevo"],
    ],
  );
});

test("SDLXLIFF sin segmentar: un segmento bloqueado en PECAT sale con locked y uno sin confirmar como borrador", () => {
  const tus = tusFor(FILE).map((tu) =>
    tu.externalId === "u3" ? { ...tu, block: true, blockReason: "MANUAL" } : tu.externalId === "u1" ? { ...tu, Status: "TRANSLATED_MT", reviewLiteral: null } : tu,
  );
  const { text, report } = writeSdlxliff(FILE, tus);
  assert.match(text, /<sdl:seg id="1" conf="Draft" origin="mt"\/>/);
  assert.match(text, /<sdl:seg id="4" conf="Translated" origin="mt" locked="true"\/>/);
  assert.equal(report.lockWritten, 1);
});

test("SDLXLIFF ya segmentado y XLIFF plano: no cambian", () => {
  const plain = FILE.replace(` xmlns:sdl="${SDL}"`, "").replace(` sdl:version="1.0"`, "").replace(/<sdl:cmt id="c1"\/>/, "");
  const { text } = writeSdlxliff(plain, tusFor(plain));
  assert.doesNotMatch(text, /mtype="seg"/, "un XLIFF plano no lleva marcas de Trados");
  assert.match(text, /<target state="translated">Busca de nuevo<\/target>/);
});
