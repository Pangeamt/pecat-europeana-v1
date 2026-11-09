// A line break INSIDE a segment is written as LF, even when the file's own
// structure uses CRLF. Before (Leginda P_2026_1627, 2026-11-06) the writer
// turned every "\n" of the translation into the file's "\r\n": Trados showed
// ¶ instead of ↵ and the Excel cells got a CR the source never had.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readSdlxliffSegments } from "../../modules/documents/sdlxliff/reader.js";
import { escapeText, writeSdlxliff } from "../../modules/documents/sdlxliff/writer.js";
import { splitWhitespace } from "../../lib/whitespace.js";

const SDL = "http://sdl.com/FileTypes/SdlXliff/1.0";
const X = "urn:oasis:names:tc:xliff:document:1.2";
const head = `<?xml version="1.0" encoding="utf-8"?><xliff xmlns:sdl="${SDL}" xmlns="${X}" version="1.2" sdl:version="1.0">`;

// Structure in CRLF, segment text with a bare LF: as the client's file came.
const crlf = (lines) => lines.join("\r\n");

const targetsOf = (text) => [...text.matchAll(/<target[^>]*>([\s\S]*?)<\/target>/g)].map((m) => m[1]);

function tusFor(raw, translate) {
  return readSdlxliffSegments(raw).segments.map((s) => {
    const externalId = s.mid != null ? `${s.transUnitId}::${s.mid}` : s.transUnitId;
    const text = translate(s.source);
    return { externalId, srcLiteral: s.source, translatedLiteral: text, reviewLiteral: text, Status: "ACCEPTED" };
  });
}

// What the editor/DAAIT may hand back: LF, CRLF or a lone CR.
const GREEK = {
  "Plug in all cables \nbefore starting the \nlaptop": "Συνδέστε όλα τα καλώδια\nπριν από την εκκίνηση του\nφορητού υπολογιστή",
  "Connect to WiFi \nIf laptop is not connected.": "Σύνδεση σε WiFi \r\nΕάν ο φορητός δεν είναι συνδεδεμένος.",
  "Set Password\nFollow instructions.": "Ορισμός κωδικού\rΑκολουθήστε τις οδηγίες.",
};

test("escapeText: \\r\\n y \\r sueltos salen como \\n", () => {
  assert.equal(escapeText("a\r\nb\rc\nd"), "a\nb\nc\nd");
  assert.equal(escapeText('<a & "b">'), "&lt;a &amp; &quot;b&quot;&gt;");
});

test("SDLXLIFF segmentado con estructura CRLF: el salto del destino es LF y la estructura sigue en CRLF", () => {
  const unit = (id, mid, src) =>
    `<trans-unit id="${id}"><source>${src}</source><seg-source><mrk mtype="seg" mid="${mid}">${src}</mrk></seg-source>` +
    `<target><mrk mtype="seg" mid="${mid}" /></target><sdl:seg-defs><sdl:seg id="${mid}" /></sdl:seg-defs></trans-unit>`;
  const raw = crlf([
    head,
    `<file original="a.xlsx" source-language="en-US" target-language="el-GR" datatype="x-sdlfilterframework2"><body>`,
    unit("u1", "237", "Plug in all cables \nbefore starting the \nlaptop"),
    unit("u2", "239", "Connect to WiFi \nIf laptop is not connected."),
    unit("u3", "240", "Set Password\nFollow instructions."),
    `</body></file></xliff>`,
  ]);
  const { text, report } = writeSdlxliff(raw, tusFor(raw, (s) => GREEK[s]));
  assert.equal(report.written, 3);
  const targets = targetsOf(text);
  assert.equal(targets.length, 3);
  for (const t of targets) assert.doesNotMatch(t, /\r/, `destino con CR: ${JSON.stringify(t)}`);
  assert.match(targets[0], /καλώδια\nπριν από την εκκίνηση του\nφορητού/);
  assert.match(targets[1], /WiFi \nΕάν/);
  assert.match(targets[2], /κωδικού\nΑκολουθήστε/);
  // The file's own CRLF (between elements) is untouched: same count as the original.
  assert.equal((text.match(/\r\n/g) ?? []).length, (raw.match(/\r\n/g) ?? []).length);
  // Read again, the target says exactly what PECAT stored (with LF).
  const again = readSdlxliffSegments(text).segments.map((s) => s.target);
  assert.deepEqual(again, [GREEK[Object.keys(GREEK)[0]], "Σύνδεση σε WiFi \nΕάν ο φορητός δεν είναι συνδεδεμένος.", "Ορισμός κωδικού\nΑκολουθήστε τις οδηγίες."]);
});

test("SDLXLIFF sin segmentar con estructura CRLF: tampoco mete CR en el destino", () => {
  const raw = crlf([
    head,
    `<file original="a.xlsx" source-language="en-US" target-language="el-GR" datatype="x-sdlfilterframework2"><body>`,
    `<group><trans-unit id="u1"><source>Plug in all cables \nbefore starting the \nlaptop</source>`,
    `<seg-source>Plug in all cables \nbefore starting the \nlaptop</seg-source><target/></trans-unit></group>`,
    `</body></file></xliff>`,
  ]);
  const { text, report } = writeSdlxliff(raw, tusFor(raw, (s) => GREEK[s] ?? "Χ"));
  assert.ok(report.written >= 1);
  for (const t of targetsOf(text)) assert.doesNotMatch(t, /\r/, `destino con CR: ${JSON.stringify(t)}`);
});

test("XLIFF plano (.xlf) con estructura CRLF: el <target> creado lleva LF dentro del texto", () => {
  const raw = crlf([
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<xliff xmlns="${X}" version="1.2"><file original="a" source-language="en" target-language="el" datatype="plaintext"><body>`,
    `  <trans-unit id="1"><source>Set Password\nFollow instructions.</source></trans-unit>`,
    `</body></file></xliff>`,
  ]);
  const { text, report } = writeSdlxliff(raw, tusFor(raw, (s) => GREEK[s]));
  assert.equal(report.written, 1);
  const [target] = targetsOf(text);
  assert.equal(target, "Ορισμός κωδικού\nΑκολουθήστε τις οδηγίες.");
});

test("Mostrar espacios: el CR se marca con ¶ y el LF con ↵ (como Trados)", () => {
  const marks = splitWhitespace("a\r\nb\nc").filter((p) => p.ws).map((p) => p.ws.mark);
  assert.deepEqual(marks, ["¶", "↵", "↵"]);
});
