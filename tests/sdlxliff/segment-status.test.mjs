// Estado del segmento "como Trados": lo que el fichero del cliente decia de cada segmento
// (numero, nivel de confirmacion, origen) se lee al importar y la rejilla lo muestra hasta
// que se toca en PECAT-E. Y la regla de que lo que YA trae target no se manda a traducir.
// node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { readSdlxliffSegments } from "../../modules/documents/sdlxliff/reader.js";
import { writeSdlxliff } from "../../modules/documents/sdlxliff/writer.js";
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
  block: false,
  fileTarget: true,
  ...over,
});

test("rejilla: bloqueado es UN icono, diga lo que diga el fichero o quien lo bloqueara", () => {
  for (const fileConf of ["Translated", "ApprovedSignOff", "signed-off", null]) {
    assert.equal(segmentState(tu({ block: true, blockReason: "INTERNAL", Status: "ACCEPTED", fileConf })), S.LOCKED);
  }
  assert.equal(segmentState(tu({ block: true, blockReason: "TM_MATCH", Status: "ACCEPTED", fileTarget: false })), S.LOCKED);
  assert.equal(segmentState(tu({ block: true, blockReason: "MANUAL" })), S.LOCKED);
  assert.equal(segmentState(tu({ block: true, blockReason: "MANUAL" }), { hasDraft: true }), S.LOCKED);
});

test("rejilla: sin confirmar se ve igual venga de DAAIT o del cliente", () => {
  const daait = tu({ Status: "TRANSLATED_MT", fileTarget: false });
  const cliente = tu({ Status: "NOT_REVIEWED", fileConf: "Translated", fileOrigin: "tm", filePercent: 100 });
  assert.equal(segmentState(daait), S.PENDING);
  assert.equal(segmentState(cliente), S.PENDING);
  assert.equal(segmentState(tu({ fileConf: "ApprovedTranslation" })), S.PENDING, "el nivel del fichero no cambia la rejilla");
});

test("rejilla: confirmar sin cambios, confirmar con cambios y rechazar son tres situaciones", () => {
  const at = "2026-10-06T10:00:00.000Z";
  assert.equal(segmentState(tu({ Status: "ACCEPTED", reviewLiteral: "Texte", reviewedAt: at })), S.CONFIRMED);
  assert.equal(segmentState(tu({ Status: "EDITED", reviewLiteral: "Autre", reviewedAt: at })), S.EDITED);
  assert.equal(segmentState(tu({ Status: "REJECTED", reviewedAt: at })), S.REJECTED);
  // escribir en un segmento confirmado lo devuelve a "sin revisar" hasta confirmarlo otra vez
  assert.equal(segmentState(tu({ Status: "ACCEPTED", reviewedAt: at }), { hasDraft: true }), S.PENDING);
  // un borrador guardado sin confirmar sigue sin revisar
  assert.equal(segmentState(tu({ reviewLiteral: "a medias", reviewedAt: at })), S.PENDING);
});

test("insignia: AT y coincidencia parcial; NUNCA 100%, CM ni PM, y nada en los bloqueados", () => {
  assert.deepEqual(segmentOrigin(tu({ Status: "TRANSLATED_MT", fileTarget: false })), { text: "AT", kind: "mt", edited: false });
  assert.deepEqual(segmentOrigin(tu({ fileOrigin: "mt" })), { text: "AT", kind: "mt", edited: false });
  assert.deepEqual(segmentOrigin(tu({ fileOrigin: "tm", filePercent: 87 })), { text: "87%", kind: "fuzzy", edited: false });
  assert.equal(segmentOrigin(tu({ fileOrigin: "tm", filePercent: 100 })), null, "100% no se ensena");
  assert.equal(segmentOrigin(tu({ fileOrigin: "tm", filePercent: 100, fileTextMatch: "SourceAndTarget" })), null, "CM tampoco");
  assert.equal(segmentOrigin(tu({ fileOrigin: "document-match" })), null, "PM tampoco");
  assert.equal(segmentOrigin(tu({ fileOrigin: "interactive" })), null);
  assert.equal(segmentOrigin(tu({ block: true, blockReason: "TM_MATCH", fileTarget: false })), null, "ni el 100% que bloquea PECAT-E");
  assert.equal(segmentOrigin(tu({ block: true, blockReason: "INTERNAL", fileOrigin: "tm", filePercent: 87 })), null);
  assert.equal(segmentOrigin(tu({ fileOrigin: "tm", filePercent: 87 }), { hasDraft: true }).edited, true);
  assert.equal(segmentOrigin(tu({ Status: "EDITED", reviewedAt: "x", reviewLiteral: "Autre", fileTarget: false })).edited, true);
});

test("documentos importados antes (sin datos del fichero): mismas situaciones", () => {
  const old = (over) => ({ translatedLiteral: "Texte", reviewedAt: null, block: false, ...over });
  assert.equal(segmentState(old({ Status: "TRANSLATED_MT" })), S.PENDING);
  assert.equal(segmentOrigin(old({ Status: "TRANSLATED_MT" })).text, "AT");
  assert.equal(segmentState(old({ Status: "NOT_REVIEWED" })), S.PENDING);
  assert.equal(segmentState(old({ Status: "ACCEPTED", block: true, blockReason: "INTERNAL" })), S.LOCKED);
  assert.equal(segmentState(old({ Status: "ACCEPTED" })), S.CONFIRMED);
  assert.equal(segmentState(old({ Status: "EDITED" })), S.EDITED);
});

// ---- Lo que sale en el fichero exportado: los niveles de Trados, no los de la rejilla ----
const confOf = (text, id) => new RegExp(`<sdl:seg id="${id}"([^>]*)/>`).exec(text)[1].trim();
const row = (id, over) => ({ externalId: `t${id}::${id}`, translatedLiteral: null, reviewLiteral: null, Status: "NOT_REVIEWED", ...over });

test("exportar .sdlxliff: cada situacion sale con el nivel de Trados que le toca", () => {
  const { text } = writeSdlxliff(FILE, [
    // 1: vacio en el fichero, lo tradujo DAAIT y nadie lo confirmo
    row(1, { translatedLiteral: "Résumé", Status: "TRANSLATED_MT", fileTarget: false }),
    // 2: del cliente, confirmado tal cual
    row(2, { translatedLiteral: "Titre de l’article", reviewLiteral: "Titre de l’article", Status: "ACCEPTED", fileTarget: true }),
    // 4: bloqueado en el fichero
    row(4, { translatedLiteral: "Titre du bloc", Status: "ACCEPTED", blockReason: "INTERNAL", fileTarget: true }),
    // 5: del cliente (venia Draft/mt), nadie lo toco
    row(5, { translatedLiteral: "Vide", fileTarget: true }),
    // 6: del cliente, editado y confirmado
    row(6, { translatedLiteral: "Illustration", reviewLiteral: "Graphique", Status: "EDITED", fileTarget: true }),
  ]);
  assert.equal(confOf(text, 1), `conf="Draft" origin="mt"`, "DAAIT sin confirmar: borrador de traduccion automatica");
  assert.match(text, /<mrk mtype="seg" mid="1">Résumé<\/mrk>/);
  assert.equal(confOf(text, 2), `conf="Translated" origin="tm" percent="100" text-match="SourceAndTarget"`, "confirmado tal cual: conserva su origen");
  assert.equal(confOf(text, 4), `conf="ApprovedSignOff" origin="tm" percent="87" locked="true"`, "bloqueado: intacto");
  assert.equal(confOf(text, 5), `conf="Draft" origin="mt"`, "sin tocar: intacto");
  assert.equal(confOf(text, 6), `conf="Translated" origin="interactive"`, "editado: Translated, escrito a mano");
  assert.ok(!text.includes("ApprovedTranslation"), "confirmar nunca sale como aprobacion de revisor");
});

test("exportar .sdlxliff: lo de DAAIT confirmado tal cual sale Translated/mt, y rechazado RejectedTranslation", () => {
  const confirmed = writeSdlxliff(FILE, [
    row(1, { translatedLiteral: "Résumé", reviewLiteral: "Résumé", Status: "ACCEPTED", fileTarget: false }),
  ]);
  assert.equal(confOf(confirmed.text, 1), `conf="Translated" origin="mt"`);
  const rejected = writeSdlxliff(FILE, [row(1, { translatedLiteral: "Résumé", Status: "REJECTED", fileTarget: false })]);
  assert.equal(confOf(rejected.text, 1), `conf="RejectedTranslation" origin="interactive"`);
});

const XLF = (units) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<xliff version="1.2" xmlns="${X}"><file original="a" source-language="en" target-language="fr" datatype="plaintext"><body>\n${units}\n</body></file></xliff>`;
const plain = (id, over) => ({ externalId: id, translatedLiteral: null, reviewLiteral: null, Status: "NOT_REVIEWED", ...over });

test("exportar .xlf: borrador, traducido y rechazado salen con estados DISTINTOS, los que lee Trados", () => {
  const raw = XLF(
    [
      `<trans-unit id="a"><source>Open</source><target/></trans-unit>`,
      `<trans-unit id="b"><source>Close</source><target/></trans-unit>`,
      `<trans-unit id="c"><source>Save</source><target/></trans-unit>`,
      `<trans-unit id="d"><source>Exit</source><target state="translated" state-qualifier="leveraged-tm">Quitter</target></trans-unit>`,
      `<trans-unit id="e"><source>Lock</source><target state="signed-off" state-qualifier="exact-match">Verrou</target></trans-unit>`,
    ].join("\n"),
  );
  const { text } = writeSdlxliff(raw, [
    plain("a", { translatedLiteral: "Ouvrir", Status: "TRANSLATED_MT", fileTarget: false }),
    plain("b", { translatedLiteral: "Fermer", reviewLiteral: "Clore", Status: "EDITED", fileTarget: false }),
    plain("c", { translatedLiteral: "Enregistrer", Status: "REJECTED", fileTarget: false }),
    plain("d", { translatedLiteral: "Quitter", reviewLiteral: "Sortir", Status: "EDITED", fileTarget: true }),
    plain("e", { translatedLiteral: "Verrou", Status: "ACCEPTED", blockReason: "INTERNAL", fileTarget: true }),
  ]);
  assert.match(text, /<target state="needs-translation">Ouvrir<\/target>/, "DAAIT sin confirmar = Draft en Trados");
  assert.match(text, /<target state="translated">Clore<\/target>/, "confirmado = Translated en Trados");
  assert.match(text, /<target state="needs-review-translation">Enregistrer<\/target>/, "rechazado");
  assert.match(text, /<target state="translated" state-qualifier="leveraged-tm">Sortir<\/target>/, "del cliente editado: conserva su marca de origen");
  assert.match(text, /<target state="signed-off" state-qualifier="exact-match">Verrou<\/target>/, "bloqueado del cliente: intacto");
  assert.equal((text.match(/<trans-unit /g) || []).length, 5, "mismo numero de segmentos");
});

test("numero: el de Trados si se guardo; si no, el orden en el documento", () => {
  assert.equal(segmentNumberOf({ segmentNumber: 1461, count: 1455 }), 1461);
  assert.equal(segmentNumberOf({ segmentNumber: null, count: 1455 }), 1456);
  assert.equal(segmentNumberOf({}, 7), 7);
});

test("filtro de estado: todo lo que enseña la columna, situación y origen", async () => {
  const { STATUS_FILTER_VALUES, matchesStatusSelection } = await import("../../lib/segment-status.js");
  assert.deepEqual(STATUS_FILTER_VALUES, ["NOT_REVIEWED", "ACCEPTED", "EDITED", "REJECTED", "LOCKED", "ORIGIN_MT", "ORIGIN_FUZZY"]);
  const mtPending = { Status: "TRANSLATED_MT", translatedLiteral: "x", fileTarget: false, block: false };
  const mtConfirmed = { ...mtPending, Status: "ACCEPTED", reviewLiteral: "x", reviewedAt: new Date() };
  const fuzzy = { Status: "NOT_REVIEWED", translatedLiteral: "x", fileTarget: true, fileOrigin: "tm", filePercent: 87, block: false };
  const fileExact = { Status: "NOT_REVIEWED", translatedLiteral: "x", fileTarget: true, fileOrigin: "tm", filePercent: 100, block: false };
  const locked = { ...mtPending, block: true };
  const rejected = { ...mtPending, Status: "REJECTED" };
  const pass = (values, tu) => matchesStatusSelection(values, tu);

  assert.ok([mtPending, mtConfirmed, fuzzy, fileExact, locked, rejected].every((tu) => pass([], tu)), "sin selección pasa todo");
  assert.deepEqual([mtPending, mtConfirmed, fuzzy, fileExact, locked, rejected].map((tu) => pass(["ORIGIN_MT"], tu)), [true, true, false, false, false, true], "AT: lo traducido por máquina, confirmado o no; un bloqueado no lleva insignia");
  assert.deepEqual([mtPending, fuzzy, fileExact].map((tu) => pass(["ORIGIN_FUZZY"], tu)), [false, true, false]);
  assert.deepEqual([mtPending, fuzzy, locked].map((tu) => pass(["NOT_REVIEWED"], tu)), [true, true, false], "un bloqueado no es «sin revisar»");
  assert.deepEqual([mtPending, locked].map((tu) => pass(["LOCKED"], tu)), [false, true]);
  // Dentro de un grupo se suman; entre grupos se cruzan.
  assert.deepEqual([mtPending, mtConfirmed, rejected, locked].map((tu) => pass(["NOT_REVIEWED", "REJECTED"], tu)), [true, false, true, false]);
  assert.deepEqual([mtPending, mtConfirmed, fuzzy].map((tu) => pass(["NOT_REVIEWED", "ORIGIN_MT"], tu)), [true, false, false], "sin revisar Y de traducción automática");
  assert.deepEqual([mtPending, fuzzy, fileExact].map((tu) => pass(["ORIGIN_MT", "ORIGIN_FUZZY"], tu)), [true, true, false]);
  assert.equal(matchesStatusSelection(["NOT_REVIEWED"], mtConfirmed, { hasDraft: true }), true);
  assert.equal(matchesStatusSelection(["ACCEPTED"], mtConfirmed, { hasDraft: true }), false, "con texto sin guardar vuelve a «sin revisar»");
});
