// Segmentos ocultos al importar (visibility-rules.js: una URL sola): no van a la MT ni
// al editor, asi que no tienen texto propio. Al exportar salen con su ORIGEN como destino,
// sin confirmar (en Trados: Draft, origen "source", lo mismo que "copiar origen en destino").
// Hasta el 2026-11-11 salian VACIOS (7 por manual de Leginda, P_2026_1627).
// node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { DOMParser } from "@xmldom/xmldom";
import { exportTarget, leavesWithSource } from "../../modules/documents/export-target.js";
import { resolveHiddenBy } from "../../modules/documents/visibility-rules.js";
import { readSdlxliffSegments } from "../../modules/documents/sdlxliff/reader.js";
import { invariants, writeSdlxliff } from "../../modules/documents/sdlxliff/writer.js";

const URL = "<g198>https://www.machinemd.com/neos/support</g198>";
const hidden = (over) => ({ visible: false, hiddenBy: "url-only", srcLiteral: URL, translatedLiteral: null, reviewLiteral: null, Status: "NOT_REVIEWED", ...over });

test("regla: oculto sin MT ni revision -> su origen", () => {
  assert.equal(exportTarget(hidden()), URL);
  assert.equal(leavesWithSource(hidden()), true);
  assert.equal(exportTarget(hidden({ Status: "TRANSLATED_MT" })), URL);
  assert.equal(exportTarget(hidden({ reviewLiteral: "borrador", Status: "NOT_REVIEWED" })), URL, "un borrador sin aprobar no sale");
});

test("regla: oculto con MT -> la MT; aprobado -> la revision", () => {
  assert.equal(exportTarget(hidden({ translatedLiteral: "MT" })), "MT");
  assert.equal(leavesWithSource(hidden({ translatedLiteral: "MT" })), false);
  assert.equal(exportTarget(hidden({ translatedLiteral: "MT", reviewLiteral: "REV", Status: "EDITED" })), "REV");
  assert.equal(exportTarget(hidden({ reviewLiteral: "REV", Status: "ACCEPTED" })), "REV");
  assert.equal(leavesWithSource(hidden({ reviewLiteral: "REV", Status: "ACCEPTED" })), false);
});

test("regla: visible sin nada -> \"\" (como siempre); sin origen tampoco inventa nada", () => {
  assert.equal(exportTarget({ visible: true, srcLiteral: "Hello", translatedLiteral: null, Status: "NOT_REVIEWED" }), "");
  assert.equal(exportTarget({ srcLiteral: "Hello", Status: "NOT_REVIEWED" }), "", "filas sin el campo visible");
  assert.equal(leavesWithSource({ visible: true, srcLiteral: "Hello" }), false);
  assert.equal(exportTarget(hidden({ srcLiteral: "" })), "");
  assert.equal(exportTarget(hidden({ srcLiteral: null })), "");
});

// ---- Exportacion real con el escritor: un manual de Leginda en pequeno ----
const X = "urn:oasis:names:tc:xliff:document:1.2";
const SDL = "http://sdl.com/FileTypes/SdlXliff/1.0";
const unit = (id, source, target = `<mrk mtype="seg" mid="${id}"/>`) =>
  `<trans-unit id="t${id}"><source>${source}</source><seg-source><mrk mtype="seg" mid="${id}">${source}</mrk></seg-source>` +
  `<target>${target}</target><sdl:seg-defs><sdl:seg id="${id}"/></sdl:seg-defs></trans-unit>`;
const FILE = [
  `<?xml version="1.0" encoding="utf-8"?><xliff xmlns:sdl="${SDL}" xmlns="${X}" version="1.2" sdl:version="1.0">`,
  `<file original="manual.docx" source-language="en-US" target-language="el-GR" datatype="x-sdlfilterframework2"><body>`,
  unit(19, "Visit our support page:"),
  unit(20, `<g id="198">https://www.machinemd.com/neos/support</g>`),
  unit(21, "https://varjo.com/eula/"),
  `</body></file></xliff>`,
].join("\n");

// Filas Tu como las guarda la importacion (buildTusDataFromSdlxliffSegments + resolveHiddenBy).
const rowsOf = (raw, mt) =>
  readSdlxliffSegments(raw).segments.map((s) => {
    const hiddenBy = resolveHiddenBy(s.source);
    return {
      externalId: `${s.transUnitId}::${s.mid}`,
      srcLiteral: s.source,
      translatedLiteral: hiddenBy ? null : (mt[s.transUnitId] ?? null),
      reviewLiteral: null,
      Status: hiddenBy ? "NOT_REVIEWED" : "TRANSLATED_MT",
      fileTarget: false,
      visible: !hiddenBy,
      hiddenBy,
    };
  });
const targetOf = (text, id) => new RegExp(`<target><mrk mtype="seg" mid="${id}"(?:/>|>([\\s\\S]*?)</mrk>)</target>`).exec(text)?.[1] ?? null;
const segOf = (text, id) => new RegExp(`<sdl:seg id="${id}"([^>]*)/>`).exec(text)[1].trim();
const wellFormed = (text) => {
  new DOMParser({ onError: (l, m) => { if (l !== "warning") throw new Error(m); } }).parseFromString(text, "text/xml");
  return true;
};

test("importacion: las dos URL quedan ocultas (url-only), la frase no", () => {
  const rows = rowsOf(FILE, {});
  assert.deepEqual(rows.map((r) => [r.externalId, r.hiddenBy]), [["t19::19", null], ["t20::20", "url-only"], ["t21::21", "url-only"]]);
  assert.equal(rows[1].srcLiteral, URL, "el origen guardado lleva la etiqueta como marcador");
});

test("exportar .sdlxliff: la URL oculta sale con su origen (etiqueta real incluida), Draft / origin source", () => {
  const rows = rowsOf(FILE, { t19: "Επισκεφθείτε τη σελίδα υποστήριξης:" });
  const { text, report } = writeSdlxliff(FILE, rows);
  assert.equal(targetOf(text, 19), "Επισκεφθείτε τη σελίδα υποστήριξης:");
  assert.equal(targetOf(text, 20), `<g id="198">https://www.machinemd.com/neos/support</g>`);
  assert.equal(targetOf(text, 21), "https://varjo.com/eula/");
  assert.equal(segOf(text, 19), `conf="Draft" origin="mt"`);
  assert.equal(segOf(text, 20), `conf="Draft" origin="source"`);
  assert.equal(segOf(text, 21), `conf="Draft" origin="source"`);
  assert.equal(report.written, 3);
  assert.equal(report.skippedTags, 0);
  assert.equal(wellFormed(text), true);
  assert.deepEqual(invariants(text), { shared: 0, orphans: 0, withoutSeg: 0 });
});

test("exportar .sdlxliff: antes del arreglo (sin la marca de oculto) el destino salia vacio", () => {
  const rows = rowsOf(FILE, {}).map((r) => ({ ...r, visible: true }));
  const { text, report } = writeSdlxliff(FILE, rows);
  assert.equal(targetOf(text, 20), null, "<mrk/> vacio, como lo entregaba PECAT-E");
  assert.equal(report.written, 0);
});

test("exportar .xlf: la URL oculta crea su <target> con el origen y el estado de la MT sin confirmar", () => {
  const raw =
    `<?xml version="1.0" encoding="UTF-8"?>\n<xliff version="1.2" xmlns="${X}">\n` +
    `  <file source-language="en" target-language="el" datatype="plaintext" original="a.txt">\n    <body>\n` +
    `      <trans-unit id="u1">\n        <source>https://varjo.com/eula/</source>\n      </trans-unit>\n` +
    `      <trans-unit id="u2">\n        <source>See <g id="5">www.varjo.com</g></source>\n        <target/>\n      </trans-unit>\n` +
    `    </body>\n  </file>\n</xliff>\n`;
  const rows = readSdlxliffSegments(raw).segments.map((s) => ({
    externalId: s.transUnitId,
    srcLiteral: s.source,
    translatedLiteral: null,
    Status: "NOT_REVIEWED",
    visible: !resolveHiddenBy(s.source),
  }));
  assert.deepEqual(rows.map((r) => r.visible), [false, true], "«See www…» no es solo una URL");
  const { text } = writeSdlxliff(raw, rows);
  assert.match(text, /<source>https:\/\/varjo\.com\/eula\/<\/source>\n {8}<target state="needs-translation">https:\/\/varjo\.com\/eula\/<\/target>/);
  assert.match(text, /<trans-unit id="u2">\n {8}<source>See <g id="5">www\.varjo\.com<\/g><\/source>\n {8}<target\/>/, "la visible sin traducir no se toca");
  assert.equal(wellFormed(text), true);
});
