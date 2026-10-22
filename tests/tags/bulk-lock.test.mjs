// "Lock / unlock the filtered segments": what the server decides before
// saving (lib/bulk-confirm.js). node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { isFileLocked, lockableInBulk, planBulkLock } from "../../lib/bulk-confirm.js";

const rows = [
  { id: "a", srcLiteral: "Same", block: false, blockReason: null },
  { id: "b", srcLiteral: "Same", block: false, blockReason: null },
  { id: "c", srcLiteral: "Other", block: true, blockReason: "MANUAL" },
  { id: "d", srcLiteral: "File", block: true, blockReason: "INTERNAL" },
  { id: "e", srcLiteral: "TM", block: true, blockReason: "TM_MATCH" },
];
const items = (...ids) => ids.map((tuId) => ({ tuId }));

test("lock: every unlocked segment of the list, in order, same source or not", () => {
  const { jobs, failed, skipped } = planBulkLock(items("b", "a", "c"), rows, "lock");
  assert.deepEqual(jobs.map((tu) => tu.id), ["b", "a"]);
  assert.equal(skipped, 1);
  assert.deepEqual(failed, []);
});

test("unlock: locked segments only, never the ones locked in the source file", () => {
  const { jobs, skipped } = planBulkLock(items("a", "c", "d", "e"), rows, "unlock");
  assert.deepEqual(jobs.map((tu) => tu.id), ["c", "e"]);
  assert.equal(skipped, 2);
});

test("unknown and repeated segments", () => {
  const { jobs, failed } = planBulkLock(items("a", "a", "zz"), rows, "lock");
  assert.deepEqual(jobs.map((tu) => tu.id), ["a"]);
  assert.deepEqual(failed.map((f) => [f.tuId, f.code]), [["zz", "NOT_FOUND"]]);
});

test("lockableInBulk matches what the editor counts", () => {
  assert.equal(lockableInBulk(rows[0], "lock"), true);
  assert.equal(lockableInBulk(rows[2], "lock"), false);
  assert.equal(lockableInBulk(rows[2], "unlock"), true);
  assert.equal(lockableInBulk(rows[3], "unlock"), false);
  assert.equal(lockableInBulk(null, "lock"), false);
});

test("a segment locked in the client's file is never locked nor unlocked by PECAT", () => {
  const fileRows = [
    { id: "f1", block: true, blockReason: "INTERNAL", fileLocked: true },
    { id: "f2", block: true, blockReason: "INTERNAL", fileLocked: null }, // documents older than fileLocked
    { id: "f3", block: false, blockReason: null, fileLocked: true },
  ];
  for (const row of fileRows) {
    assert.equal(isFileLocked(row), true, row.id);
    assert.equal(lockableInBulk(row, "lock"), false, `${row.id} lock`);
    assert.equal(lockableInBulk(row, "unlock"), false, `${row.id} unlock`);
  }
  assert.equal(isFileLocked({ block: true, blockReason: "MANUAL", fileLocked: false }), false);
  const { jobs, skipped } = planBulkLock([{ tuId: "f3" }, { tuId: "f1" }], fileRows, "lock");
  assert.deepEqual(jobs, []);
  assert.equal(skipped, 2);
});
