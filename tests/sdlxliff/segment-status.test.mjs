// Estado del segmento "como Trados": lo que el fichero del cliente decia de cada segmento
// (numero, nivel de confirmacion, origen) se lee al importar y la rejilla lo muestra hasta
// que se toca en PECAT-E. Y la regla de que lo que YA trae target no se manda a traducir.
// node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { readSdlxliffSegments } from "../../modules/documents/sdlxliff/reader.js";
import { needsMachineTranslation } from "../../lib/splice-formats.js";
import {
  SEGMENT_STATE as S,
  segmentNumberOf,
  segmentOrigin,
  segmentState,
} from "../../lib/segment-status.js";

const X = "urn:oasis:names:tc:xliff:document:1.2";
const SDL = "http://sdl.com/FileTypes/SdlXliff/1.0";
const unit = (id, source, target, segAttrs) =>
  `<trans-unit id="t${id}"><source>${source}</source><seg-source><mrk mtype="seg" mid="${id}">${source}</mrk></seg-source>` +
  `<target><mrk mtype="seg" mid="${id}">${target}</mrk></target>` +
  `<sdl:seg-defs><sdl:seg id="${id}" ${segAttrs}/></sdl:seg-defs></trans-unit>`;
const FILE = [
  `<?xml version="1.0" encoding="utf-8"?><xliff xmlns:sdl="${SDL}" xmlns="${X}" version="1.2" sdl:version="1.0">`,
  `<file original="a.docx" source-language="en-GB" target-language="fr-FR" datatype="x-sdlfilterframework2"><body>`,
  unit(1, "Summary", "", ``),
  unit(2, "Article title", "Titre de l’article", `conf="Translated" origin="tm" percent="100" text-match="SourceAndTarget"`),
  // solo etiquetas: PECAT-E no lo importa, pero Trados lo numera
  `<trans-unit id="t3"><source><x id="9"/></source><seg-source><mrk mtype="seg" mid="3"><x id="9"/></mrk></seg-source><target><mrk mtype="seg" mid="3"><x id="9"/></mrk></target><sdl:seg-defs><sdl:seg id="3"/></sdl:seg-defs></trans-unit>`,
  // no traducible: no es un segmento del editor de Trados
  `<trans-unit id="meta" translate="no"><source>slide</source></trans-unit>`,
  unit(4, "Block title", "Titre du bloc", `conf="ApprovedSignOff" origin="tm" percent="87" locked="true"`),
  unit(5, "Blank", "Vide", `conf="Draft" origin="mt"`),
  unit(6, "Graphic", "Illustration", `conf="RejectedTranslation" origin="interactive"`),
  `</body></file></xliff>`,
].join("\n");

test("importacion: cada segmento guarda su numero de Trados aunque haya segmentos sin importar", () => {
  const { segments } = readSdlxliffSegments(FILE);
  assert.deepEqual(
    segments.map((s) => [s.transUnitId, s.segmentNumber]),
    [["t1", 1], ["t2", 2], ["t4", 4], ["t5", 5], ["t6", 6]],
    "t3 (solo etiquetas) cuenta como el 3; el translate=no no cuenta",
  );
});

test("importacion: se leen conf, origen, porcentaje, text-match y bloqueo", () => {
  const by = Object.fromEntries(readSdlxliffSegments(FILE).segments.map((s) => [s.transUnitId, s]));
  assert.deepEqual(
    [by.t2.conf, by.t2.origin, by.t2.percent, by.t2.textMatch, by.t2.locked],
    ["Translated", "tm", 100, "SourceAndTarget", false],
  );
  assert.deepEqual([by.t4.conf, by.t4.percent, by.t4.locked], ["ApprovedSignOff", 87, true]);
  assert.deepEqual([by.t1.conf, by.t1.origin, by.t1.target], [null, null, null]);
});

test("politica: solo los vacios y no bloqueados van a traduccion automatica", () => {
  const { segments } = readSdlxliffSegments(FILE);
  assert.deepEqual(
    segments.filter(needsMachineTranslation).map((s) => s.transUnitId),
    ["t1"],
    "t2, t5 y t6 ya traen target (sin bloquear) y NO se mandan; t4 esta bloqueado",
  );
  assert.equal(needsMachineTranslation({ target: null, locked: true }), false);
  assert.equal(needsMachineTranslation({ target: null, hiddenBy: "url-only" }), false);
  assert.equal(needsMachineTranslation({ target: "ya traducido" }), false);
});

// Fila Tu tal como la guarda la importacion (ver buildTusDataFromSdlxliffSegments).
const tu = (over) => ({
  Status: "NOT_REVIEWED",
  translatedLiteral: "Texte",
  reviewLiteral: null,
  reviewedAt: null,
  fileTarget: true,
  ...over,
});

test("estado: sin tocar se muestra lo que decia el fichero", () => {
  assert.equal(segmentState(tu({ fileConf: "Draft" })), S.DRAFT);
  assert.equal(segmentState(tu({ fileConf: "Translated" })), S.TRANSLATED);
  assert.equal(segmentState(tu({ fileConf: "RejectedTranslation" })), S.TRANSLATION_REJECTED);
  assert.equal(segmentState(tu({ fileConf: "ApprovedTranslation" })), S.TRANSLATION_APPROVED);
  assert.equal(segmentState(tu({ fileConf: "RejectedSignOff" })), S.SIGN_OFF_REJECTED);
  assert.equal(segmentState(tu({ fileConf: "ApprovedSignOff" })), S.SIGNED_OFF);
  // un bloqueado (Status ACCEPTED al importar) conserva SU nivel, no "confirmado"
  assert.equal(
    segmentState(tu({ fileConf: "Translated", Status: "ACCEPTED", block: true, blockReason: "INTERNAL" })),
    S.TRANSLATED,
  );
  assert.equal(segmentState(tu({ fileConf: null, translatedLiteral: null, fileTarget: false })), S.NOT_TRANSLATED);
  assert.equal(segmentState(tu({ fileConf: "Translated", translatedLiteral: "  " })), S.NOT_TRANSLATED);
});

test("estado: los estados de XLIFF 1.2 y 2.x se leen igual", () => {
  assert.equal(segmentState(tu({ fileConf: "translated" })), S.TRANSLATED);
  assert.equal(segmentState(tu({ fileConf: "signed-off" })), S.TRANSLATION_APPROVED);
  assert.equal(segmentState(tu({ fileConf: "final" })), S.SIGNED_OFF);
  assert.equal(segmentState(tu({ fileConf: "needs-review-translation" })), S.TRANSLATION_REJECTED);
  assert.equal(segmentState(tu({ fileConf: "reviewed" })), S.TRANSLATION_APPROVED);
});

test("estado: lo que traduce PECAT-E es un borrador con origen AT", () => {
  const mt = tu({ Status: "TRANSLATED_MT", fileTarget: false, fileConf: null });
  assert.equal(segmentState(mt), S.DRAFT);
  assert.deepEqual(segmentOrigin(mt), { text: "AT", kind: "mt", edited: false });
});

test("estado: al tocarlo en PECAT-E manda lo que se hizo aqui", () => {
  const at = "2026-10-05T10:00:00.000Z";
  const base = { fileConf: "Translated", reviewedAt: at };
  assert.equal(segmentState(tu({ ...base, Status: "ACCEPTED" })), S.TRANSLATION_APPROVED);
  assert.equal(segmentState(tu({ ...base, Status: "EDITED", reviewLiteral: "Autre" })), S.TRANSLATION_APPROVED);
  assert.equal(segmentState(tu({ ...base, Status: "REJECTED" })), S.TRANSLATION_REJECTED);
  assert.equal(segmentState(tu({ ...base, reviewLiteral: "à moitié" })), S.DRAFT, "borrador guardado sin confirmar");
  // escribir en un segmento confirmado lo devuelve a borrador (lapiz azul), como en Trados
  assert.equal(segmentState(tu({ ...base, Status: "ACCEPTED" }), { hasDraft: true }), S.DRAFT);
});

test("origen: AT, CM, 100%, difuso y PM; pierde el relleno al editar", () => {
  assert.deepEqual(segmentOrigin(tu({ fileOrigin: "mt" })), { text: "AT", kind: "mt", edited: false });
  assert.deepEqual(
    segmentOrigin(tu({ fileOrigin: "tm", filePercent: 100, fileTextMatch: "SourceAndTarget" })),
    { text: "CM", kind: "exact", edited: false },
  );
  assert.equal(segmentOrigin(tu({ fileOrigin: "tm", filePercent: 100 })).text, "100%");
  assert.deepEqual(segmentOrigin(tu({ fileOrigin: "tm", filePercent: 87 })), { text: "87%", kind: "fuzzy", edited: false });
  assert.equal(segmentOrigin(tu({ fileOrigin: "document-match" })).text, "PM");
  assert.equal(segmentOrigin(tu({ fileOrigin: "interactive" })), null, "escrito a mano: sin insignia");
  assert.equal(segmentOrigin(tu({ fileOrigin: "tm", filePercent: 87 }), { hasDraft: true }).edited, true);
  assert.equal(
    segmentOrigin(tu({ fileOrigin: "tm", filePercent: 87, Status: "EDITED", reviewedAt: "x", reviewLiteral: "Autre" })).edited,
    true,
  );
  assert.equal(segmentOrigin(tu({ blockReason: "TM_MATCH", fileTarget: false })).text, "100%");
});

test("documentos importados antes (sin datos del fichero): se ve como hasta ahora", () => {
  const old = (over) => ({ translatedLiteral: "Texte", reviewedAt: null, ...over });
  assert.equal(segmentState(old({ Status: "TRANSLATED_MT" })), S.DRAFT);
  assert.equal(segmentOrigin(old({ Status: "TRANSLATED_MT" })).text, "AT");
  assert.equal(segmentState(old({ Status: "NOT_REVIEWED" })), S.TRANSLATED);
  assert.equal(segmentState(old({ Status: "ACCEPTED", block: true, blockReason: "INTERNAL" })), S.TRANSLATED);
  assert.equal(segmentState(old({ Status: "ACCEPTED" })), S.TRANSLATION_APPROVED);
  assert.equal(segmentState(old({ Status: "NOT_REVIEWED", translatedLiteral: null })), S.NOT_TRANSLATED);
});

test("numero: el de Trados si se guardo; si no, el orden en el documento", () => {
  assert.equal(segmentNumberOf({ segmentNumber: 1461, count: 1455 }), 1461);
  assert.equal(segmentNumberOf({ segmentNumber: null, count: 1455 }), 1456);
  assert.equal(segmentNumberOf({}, 7), 7);
});
