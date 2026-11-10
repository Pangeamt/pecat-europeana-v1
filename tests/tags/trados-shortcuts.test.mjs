// Trados shortcuts (lib/trados-shortcuts.js): what each keydown stands for,
// on a US and a Spanish keyboard. node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TRADOS_SHORTCUTS,
  applyCase,
  cycleCase,
  indexOfSegmentNumber,
  matchShortcut,
  tmIndexOf,
} from "../../lib/trados-shortcuts.js";

const key = (code, k, m = "") => ({
  code,
  key: k,
  ctrlKey: m.includes("c"),
  altKey: m.includes("a"),
  shiftKey: m.includes("s"),
  metaKey: false,
});
const id = (e) => matchShortcut(e)?.id ?? null;

test("symbols, US keyboard", () => {
  assert.equal(id(key("Space", " ", "cs")), "nbsp");
  assert.equal(id(key("Minus", "-", "c")), "enDash");
  assert.equal(id(key("Minus", "-", "ca")), "emDash");
  assert.equal(id(key("Minus", "_", "cs")), "nbHyphen");
  assert.equal(id(key("KeyC", "C", "cs")), "copyright");
  assert.equal(id(key("KeyC", "c", "ca")), "copyright");
  assert.equal(id(key("KeyR", "r", "ca")), "registered");
  assert.equal(id(key("KeyT", "t", "ca")), "trademark");
  assert.equal(id(key("KeyE", "E", "cs")), "euro");
  assert.equal(id(key("KeyP", "P", "cs")), "pound");
  assert.equal(id(key("Digit4", "$", "cs")), "quotesGerman");
  assert.equal(id(key("Digit5", "%", "cs")), "quotesEnglish");
  assert.equal(id(key("Digit6", "^", "cs")), "quotesFrench");
});

test("Spanish keyboard: the hyphen key is 'Slash'; Shift+6 is '&'", () => {
  assert.equal(id(key("Slash", "-", "c")), "enDash");
  assert.equal(id(key("Slash", "_", "cs")), "nbHyphen");
  assert.equal(id(key("Digit6", "&", "cs")), "quotesFrench");
});

test("AltGr (Ctrl+Alt) still types its character", () => {
  assert.equal(id(key("KeyE", "€", "ca")), null); // AltGr+E = €
  assert.equal(id(key("Digit2", "@", "ca")), null); // AltGr+2 = @
  assert.equal(id(key("KeyC", "ç", "ca")), null); // some layouts
});

test("every symbol shortcut inserts exactly its character", () => {
  const byId = Object.fromEntries(TRADOS_SHORTCUTS.map((s) => [s.id, s]));
  assert.equal(byId.nbsp.insert, " ");
  assert.equal(byId.enDash.insert, "–");
  assert.equal(byId.emDash.insert, "—");
  assert.equal(byId.nbHyphen.insert, "‑");
  assert.deepEqual(byId.quotesFrench.wrap, ["«", "»"]);
});

test("editing, find, TM, navigation", () => {
  assert.equal(id(key("Enter", "Enter", "ca")), "confirmNextAny");
  assert.equal(id(key("Enter", "Enter", "cas")), "confirmStay");
  assert.equal(id(key("Enter", "Enter", "c")), null); // Ctrl+Enter: handled by the editor
  assert.equal(id(key("Insert", "Insert", "c")), "copySource");
  assert.equal(id(key("Insert", "Insert", "as")), "copySourceAll");
  assert.equal(id(key("Delete", "Delete", "a")), "clearTarget");
  assert.equal(id(key("Delete", "Delete", "as")), "clearDrafts");
  assert.equal(id(key("F3", "F3", "s")), "changeCase");
  assert.equal(id(key("F3", "F3", "")), "concordance");
  assert.equal(id(key("F8", "F8", "")), "verify");
  assert.equal(id(key("KeyF", "f", "c")), "find");
  assert.equal(id(key("KeyH", "h", "c")), "replace");
  assert.equal(id(key("F4", "F4", "")), "findNext");
  assert.equal(id(key("F4", "F4", "s")), "findPrev");
  assert.equal(id(key("PageUp", "PageUp", "a")), "tmPrev");
  assert.equal(id(key("PageDown", "PageDown", "a")), "tmNext");
  assert.equal(id(key("Digit3", "3", "c")), "tmApplyN");
  assert.equal(tmIndexOf(key("Digit3", "3", "c")), 2);
  assert.equal(id(key("KeyU", "U", "cs")), "tmAdd");
  assert.equal(id(key("KeyL", "L", "cs")), "lockSelection");
  assert.equal(id(key("KeyL", "l", "c")), null); // Ctrl+L: existing handler
  assert.equal(id(key("ArrowUp", "ArrowUp", "c")), "prevSegment");
  assert.equal(id(key("ArrowDown", "ArrowDown", "cs")), null); // existing Ctrl+Shift+Down
  assert.equal(id(key("Home", "Home", "c")), "firstSegment");
  assert.equal(id(key("End", "End", "c")), "lastSegment");
  assert.equal(id(key("KeyG", "g", "c")), "goTo");
  assert.equal(id(key("KeyR", "r", "c")), "reload");
});

test("plain typing is never a shortcut", () => {
  for (const [code, k] of [["KeyA", "a"], ["Space", " "], ["Digit1", "1"], ["Minus", "-"], ["Enter", "Enter"]]) {
    assert.equal(id(key(code, k)), null);
    assert.equal(id(key(code, k.toUpperCase(), "s")), null);
  }
  assert.equal(matchShortcut({ ...key("Space", " ", "cs"), isComposing: true }), null);
});

test("no two shortcuts answer the same keydown", () => {
  const samples = [];
  for (const code of ["Space", "Minus", "Slash", "Enter", "Insert", "Delete", "F3", "F4", "F8", "PageUp", "Home", "End", "ArrowUp", "ArrowDown",
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => `Key${l}`), ..."123456789".split("").map((d) => `Digit${d}`)]) {
    for (const m of ["", "c", "a", "s", "ca", "cs", "as", "cas"]) {
      const k = code.startsWith("Key") ? code.slice(3).toLowerCase() : code.startsWith("Digit") ? code.slice(5) : code === "Space" ? " " : code === "Minus" || code === "Slash" ? "-" : code;
      samples.push(key(code, k, m));
    }
  }
  for (const e of samples) {
    const hits = TRADOS_SHORTCUTS.filter((s) => s.match && s.match(e));
    assert.ok(hits.length <= 1, `${e.code} ${e.ctrlKey}${e.altKey}${e.shiftKey}: ${hits.map((h) => h.id)}`);
  }
});

test("Shift+F3 cycles lower → UPPER → Title → lower", () => {
  assert.equal(cycleCase("hola mundo"), "HOLA MUNDO");
  assert.equal(cycleCase("HOLA MUNDO"), "Hola Mundo");
  assert.equal(cycleCase("Hola Mundo"), "hola mundo");
  assert.equal(applyCase("l'été «grand»", "title"), "L'été «Grand»");
  assert.equal(cycleCase("istanbul", "tr"), "İSTANBUL");
});

test("Go to: by the number the grid shows", () => {
  const rows = [{ n: 4 }, { n: 7 }, { n: 9 }];
  const numberOf = (row) => row.n;
  assert.equal(indexOfSegmentNumber(rows, "7", numberOf), 1);
  assert.equal(indexOfSegmentNumber(rows, 9, numberOf), 2);
  assert.equal(indexOfSegmentNumber(rows, "5", numberOf), -1);
  assert.equal(indexOfSegmentNumber(rows, "", numberOf), -1);
});

test("every shortcut has an id, group and keys; ids are unique", () => {
  const ids = TRADOS_SHORTCUTS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const s of TRADOS_SHORTCUTS) {
    assert.ok(s.id && s.group && s.keys, s.id);
    assert.ok(s.native || typeof s.match === "function", s.id);
  }
});
