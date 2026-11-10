// Find and replace in the editor (lib/find-replace.js): text only, never the
// inline tags. node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countMatches,
  planBulkReplace,
  replaceInText,
  replaceableRows,
  statusAfterReplace,
  stepMatch,
} from "../../lib/find-replace.js";

test("straight apostrophes become typographic ones, every occurrence", () => {
  const r = replaceInText("l'OMS et l'ONU d'abord", "'", "’");
  assert.equal(r.text, "l’OMS et l’ONU d’abord");
  assert.equal(r.count, 3);
});

test("the tags are never touched, not even when the query is inside one", () => {
  const text = "<g1>l'OMS</g1> <x2/> g1 x2";
  assert.equal(countMatches(text, "g1"), 1);
  const r = replaceInText(text, "g1", "Z");
  assert.equal(r.text, "<g1>l'OMS</g1> <x2/> Z x2");
  assert.equal(replaceInText(text, "x2/", "!").count, 0);
  assert.equal(replaceInText("<b1/>a<e1/>", "1", "9").text, "<b1/>a<e1/>");
});

test("a match never spans a tag", () => {
  assert.equal(countMatches("ab<x1/>cd", "bc"), 0);
  assert.equal(replaceInText("ab<x1/>cd", "b<x1/>c", "").count, 0);
});

test("case: insensitive by default, exact with matchCase", () => {
  assert.equal(countMatches("Paris paris PARIS", "paris"), 3);
  assert.equal(countMatches("Paris paris PARIS", "paris", { matchCase: true }), 1);
  assert.equal(replaceInText("Paris paris", "paris", "Roma", { matchCase: true }).text, "Paris Roma");
});

test("regex characters are literal", () => {
  assert.equal(replaceInText("a.b a*b (c)", ".", "!").text, "a!b a*b (c)");
  assert.equal(replaceInText("(c) [d] $e", "(c)", "X").text, "X [d] $e");
  assert.equal(replaceInText("x", "x", "$&$&").text, "$&$&");
});

test("empty query or text: nothing", () => {
  assert.equal(countMatches("abc", ""), 0);
  assert.equal(countMatches(null, "a"), 0);
  assert.deepEqual(replaceInText("abc", "", "x"), { text: "abc", count: 0 });
  assert.deepEqual(replaceInText(null, "a", "x"), { text: "", count: 0 });
});

test("replaceableRows: unlocked rows whose current text contains the query", () => {
  const rows = [
    { id: "a", block: false, text: "l'a" },
    { id: "b", block: true, text: "l'b" },
    { id: "c", block: false, text: "nada" },
    { id: "d", block: false, text: "<g1>'</g1>" },
  ];
  const ids = replaceableRows(rows, (r) => r.text, "'").map((r) => r.id);
  assert.deepEqual(ids, ["a", "d"]);
  assert.deepEqual(replaceableRows(rows, (r) => r.text, ""), []);
});

test("statusAfterReplace: confirmed goes back to not reviewed, the rest stay", () => {
  assert.equal(statusAfterReplace("ACCEPTED"), "NOT_REVIEWED");
  assert.equal(statusAfterReplace("EDITED"), "NOT_REVIEWED");
  assert.equal(statusAfterReplace("REJECTED"), "REJECTED");
  assert.equal(statusAfterReplace("TRANSLATED_MT"), "TRANSLATED_MT");
  assert.equal(statusAfterReplace("NOT_REVIEWED"), "NOT_REVIEWED");
});

test("planBulkReplace: locked, unknown, empty and unchanged rows are left out", () => {
  const rows = [
    { id: "a", block: false, reviewLiteral: null, translatedLiteral: "l'a" },
    { id: "b", block: true, reviewLiteral: null, translatedLiteral: "l'b" },
    { id: "c", block: false, reviewLiteral: "same", translatedLiteral: "x" },
    { id: "d", block: false, reviewLiteral: "'", translatedLiteral: "'" },
    { id: "e", block: false, reviewLiteral: "<g1>a'</g1>", translatedLiteral: "" },
  ];
  const items = [
    { tuId: "a", reviewLiteral: "l’a" },
    { tuId: "a", reviewLiteral: "dup" },
    { tuId: "b", reviewLiteral: "l’b" },
    { tuId: "zz", reviewLiteral: "x" },
    { tuId: "c", reviewLiteral: "same" },
    { tuId: "d", reviewLiteral: "  " },
    { tuId: "e", reviewLiteral: "a’" },
  ];
  const refuse = (tu, text) =>
    tu.id === "e" && !text.includes("<g1>") ? { code: "INLINE_TAGS_MISMATCH", message: "tags" } : null;
  const { jobs, failed, skipped } = planBulkReplace(items, rows, refuse);
  assert.deepEqual(jobs.map((j) => [j.tu.id, j.reviewLiteral]), [["a", "l’a"]]);
  assert.deepEqual(failed.map((f) => [f.tuId, f.code]), [
    ["b", "SEGMENT_LOCKED"],
    ["zz", "NOT_FOUND"],
    ["d", "EMPTY_TARGET"],
    ["e", "INLINE_TAGS_MISMATCH"],
  ]);
  assert.equal(skipped, 1);
});

test("stepMatch: next / previous match, wrapping around", () => {
  const ids = ["a", "c", "e"];
  assert.equal(stepMatch(ids, "a", 1), "c");
  assert.equal(stepMatch(ids, "e", 1), "a");
  assert.equal(stepMatch(ids, "a", -1), "e");
  assert.equal(stepMatch(ids, null, 1), "a");
  assert.equal(stepMatch(ids, "zz", -1), "e");
  assert.equal(stepMatch([], "a", 1), null);
});

test("planBulkReplace clear: reviewer text or confirmed status goes; nothing else to do is skipped", () => {
  const rows = [
    { id: "a", block: false, reviewLiteral: "draft", translatedLiteral: "mt", Status: "NOT_REVIEWED" },
    { id: "b", block: false, reviewLiteral: null, translatedLiteral: "mt", Status: "ACCEPTED" },
    { id: "c", block: false, reviewLiteral: null, translatedLiteral: "mt", Status: "NOT_REVIEWED" },
    { id: "d", block: true, reviewLiteral: "x", translatedLiteral: "mt", Status: "EDITED" },
  ];
  const { jobs, failed, skipped } = planBulkReplace(
    ["a", "b", "c", "d"].map((tuId) => ({ tuId })),
    rows,
    () => ({ code: "NEVER" }),
    "clear",
  );
  assert.deepEqual(jobs.map((j) => [j.tu.id, j.reviewLiteral]), [["a", null], ["b", null]]);
  assert.deepEqual(failed.map((f) => f.code), ["SEGMENT_LOCKED"]);
  assert.equal(skipped, 1);
});

test("planBulkReplace copy_source: the source as text, tags checked", () => {
  const rows = [
    { id: "a", block: false, reviewLiteral: null, translatedLiteral: "", srcLiteral: "<g1>Hi</g1>" },
  ];
  const { jobs } = planBulkReplace([{ tuId: "a", reviewLiteral: "<g1>Hi</g1>" }], rows, () => null, "copy_source");
  assert.deepEqual(jobs.map((j) => j.reviewLiteral), ["<g1>Hi</g1>"]);
});
