// A lock made in PECAT leaves the exported file locked, the way Trados reads
// it: <sdl:seg locked="true"> in an SDLXLIFF, state="final" in plain XLIFF
// 1.2 / 2.x (Trados maps "final" to "Signed off", which its XLIFF file type
// locks by default). A lock that came in the client's file is never touched.
// node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { DOMParser } from "@xmldom/xmldom";
import { readSdlxliffSegments } from "../../modules/documents/sdlxliff/reader.js";
import { lockedInPecat, writeSdlxliff } from "../../modules/documents/sdlxliff/writer.js";

const X = "urn:oasis:names:tc:xliff:document:1.2";
const SDL = "http://sdl.com/FileTypes/SdlXliff/1.0";
const wellFormed = (text) => {
  new DOMParser({ onError: (l, m) => { if (l !== "warning") throw new Error(m); } }).parseFromString(text, "text/xml");
  return true;
};
const tu = (externalId, translatedLiteral, extra = {}) => ({ externalId, translatedLiteral, Status: "TRANSLATED_MT", ...extra });
const MANUAL = { block: true, blockReason: "MANUAL", fileLocked: false };

const SDLXLIFF = [
  `<?xml version="1.0" encoding="utf-8"?><xliff xmlns:sdl="${SDL}" xmlns="${X}" version="1.2" sdl:version="1.0">`,
  `<file original="a.docx" source-language="en-US" target-language="fr-FR" datatype="x-sdlfilterframework2"><body>`,
  // s1: empty target, open
  `<trans-unit id="s1"><source>Open</source><seg-source><mrk mtype="seg" mid="1">Open</mrk></seg-source>`,
  `<target><mrk mtype="seg" mid="1"/></target><sdl:seg-defs><sdl:seg id="1"/></sdl:seg-defs></trans-unit>`,
  // s2: the client's translation, open
  `<trans-unit id="s2"><source>Close</source><seg-source><mrk mtype="seg" mid="2">Close</mrk></seg-source>`,
  `<target><mrk mtype="seg" mid="2">Fermer</mrk></target><sdl:seg-defs><sdl:seg id="2" conf="Translated" origin="tm"/></sdl:seg-defs></trans-unit>`,
  // s3: locked in the client's file
  `<trans-unit id="s3"><source>Locked</source><seg-source><mrk mtype="seg" mid="3">Locked</mrk></seg-source>`,
  `<target><mrk mtype="seg" mid="3">Verrouillé</mrk></target><sdl:seg-defs><sdl:seg id="3" locked="true" conf="ApprovedSignOff"/></sdl:seg-defs></trans-unit>`,
  // s4: empty target, open (stays unlocked)
  `<trans-unit id="s4"><source>Save</source><seg-source><mrk mtype="seg" mid="4">Save</mrk></seg-source>`,
  `<target><mrk mtype="seg" mid="4"/></target><sdl:seg-defs><sdl:seg id="4"/></sdl:seg-defs></trans-unit>`,
  `</body></file></xliff>`,
].join("\n");

const unitOf = (text, id) => new RegExp(`<trans-unit id="${id}">[\\s\\S]*?</trans-unit>`).exec(text)?.[0] ?? "";

test("lockedInPecat: PECAT's locks yes, the client's file lock never", () => {
  assert.equal(lockedInPecat({ block: true, blockReason: "MANUAL" }), true);
  assert.equal(lockedInPecat({ block: true, blockReason: "TM_MATCH" }), true);
  assert.equal(lockedInPecat({ block: true, blockReason: "LLM_JUDGE" }), true);
  assert.equal(lockedInPecat({ block: true, blockReason: "INTERNAL" }), false);
  assert.equal(lockedInPecat({ block: true, blockReason: "MANUAL", fileLocked: true }), false);
  assert.equal(lockedInPecat({ block: false, blockReason: null }), false);
});

test("SDLXLIFF: a segment locked in PECAT leaves with locked=true, written or untouched", () => {
  const { text, report } = writeSdlxliff(SDLXLIFF, [
    tu("s1::1", "Ouvrir", MANUAL),
    tu("s2::2", "Fermer", MANUAL), // the client's text, nobody confirmed it: only the lock moves
    tu("s3::3", "XXX", { block: true, blockReason: "INTERNAL", fileLocked: true }),
    tu("s4::4", "Enregistrer"),
  ]);
  assert.ok(wellFormed(text));
  assert.match(unitOf(text, "s1"), /<mrk mtype="seg" mid="1">Ouvrir<\/mrk>/);
  assert.match(unitOf(text, "s1"), /<sdl:seg id="1" conf="Draft" origin="mt" locked="true"\/>/);
  assert.match(unitOf(text, "s2"), /<sdl:seg id="2" conf="Translated" origin="tm" locked="true"\/>/, "only locked is added");
  assert.match(unitOf(text, "s2"), /<mrk mtype="seg" mid="2">Fermer<\/mrk>/);
  assert.equal(unitOf(text, "s3"), unitOf(SDLXLIFF, "s3"), "the client's locked segment is byte for byte as it came");
  assert.doesNotMatch(unitOf(text, "s4"), /locked=/, "an unlocked segment gets no lock");
  assert.equal(report.lockWritten, 2);
  assert.equal(report.skippedLocked, 1);
  const back = Object.fromEntries(readSdlxliffSegments(text).segments.map((s) => [s.transUnitId, s.locked]));
  assert.deepEqual(back, { s1: true, s2: true, s3: true, s4: false }, "PECAT reads the delivered file back as locked");
});

test("SDLXLIFF: a file-locked segment unlocked in PECAT is still not touched", () => {
  const { text } = writeSdlxliff(SDLXLIFF, [tu("s3::3", "XXX", { block: false, blockReason: null, fileLocked: true })]);
  assert.equal(text, SDLXLIFF);
});

const xlf = (units) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<xliff version="1.2" xmlns="${X}">\n  <file source-language="en" target-language="fr" datatype="plaintext" original="a.txt">\n    <body>\n${units}\n    </body>\n  </file>\n</xliff>\n`;

test("XLIFF 1.2: locked in PECAT = target state final; the client's signed-off stays as it came", () => {
  const raw = xlf(
    `      <trans-unit id="a"><source>Open</source><target/></trans-unit>\n` +
      `      <trans-unit id="b"><source>Close</source><target state="translated">Fermer</target></trans-unit>\n` +
      `      <trans-unit id="c"><source>Print</source><target state="signed-off">Imprimer</target></trans-unit>\n` +
      `      <trans-unit id="d"><source>Save</source></trans-unit>\n` +
      `      <trans-unit id="e"><source>Exit</source></trans-unit>`,
  );
  const { text, report } = writeSdlxliff(raw, [
    tu("a", "Ouvrir", MANUAL),
    tu("b", "Fermer", MANUAL),
    tu("c", "XXX", { block: true, blockReason: "INTERNAL", fileLocked: true }),
    tu("d", "Enregistrer", { block: true, blockReason: "TM_MATCH" }),
    tu("e", "Quitter"),
  ]);
  assert.ok(wellFormed(text));
  assert.match(unitOf(text, "a"), /<target state="final">Ouvrir<\/target>/);
  assert.match(unitOf(text, "b"), /<target state="final">Fermer<\/target>/, "the client's text, only the state moves");
  assert.equal(unitOf(text, "c"), unitOf(raw, "c"));
  assert.match(unitOf(text, "d"), /<target state="final">Enregistrer<\/target>/, "an older exact-match lock too");
  assert.match(unitOf(text, "e"), /<target state="needs-translation">Quitter<\/target>/, "not locked: as before");
  assert.equal(report.lockWritten, 3);
  const back = Object.fromEntries(readSdlxliffSegments(text).segments.map((s) => [s.transUnitId, s.locked]));
  assert.deepEqual(back, { a: true, b: true, c: true, d: true, e: false });
});

test("XLIFF 1.2: a unit cut into sentences is locked only when every sentence is", () => {
  const raw = xlf(`      <trans-unit id="b"><source>First one. Second one.</source><target/></trans-unit>`);
  const s1 = { srcLiteral: "First one." };
  const s2 = { srcLiteral: "Second one." };
  const all = writeSdlxliff(raw, [tu("b::~1", "Premier.", { ...s1, ...MANUAL }), tu("b::~2", "Deuxième.", { ...s2, ...MANUAL })]);
  assert.match(all.text, /<target state="final">Premier\. Deuxième\.<\/target>/);
  assert.equal(all.report.lockWritten, 2);
  const half = writeSdlxliff(raw, [tu("b::~1", "Premier.", { ...s1, ...MANUAL }), tu("b::~2", "Deuxième.", s2)]);
  assert.match(half.text, /<target state="needs-translation">Premier\. Deuxième\.<\/target>/);
  assert.equal(half.report.lockMixed, 1, "the locked half is counted");
});

test("XLIFF 2.x: locked in PECAT = segment state final", () => {
  const raw =
    `<?xml version="1.0" encoding="UTF-8"?>\n<xliff version="2.0" xmlns="urn:oasis:names:tc:xliff:document:2.0" srcLang="en" trgLang="fr">\n` +
    `  <file id="f1">\n    <unit id="u1"><segment id="s1"><source>Open</source></segment></unit>\n` +
    `    <unit id="u2"><segment id="s2" state="translated"><source>Close</source><target>Fermer</target></segment></unit>\n` +
    `    <unit id="u3"><segment id="s3"><source>Save</source></segment></unit>\n  </file>\n</xliff>\n`;
  const { text, report } = writeSdlxliff(raw, [
    tu("u1|s1", "Ouvrir", MANUAL),
    tu("u2|s2", "Fermer", MANUAL),
    tu("u3|s3", "Enregistrer"),
  ]);
  assert.ok(wellFormed(text));
  assert.match(text, /<segment id="s1" state="final"><source>Open<\/source><target>Ouvrir<\/target>/);
  assert.match(text, /<segment id="s2" state="final"><source>Close<\/source><target>Fermer<\/target>/);
  assert.doesNotMatch(text, /<segment id="s3" state="final"/);
  assert.equal(report.lockWritten, 2);
});
