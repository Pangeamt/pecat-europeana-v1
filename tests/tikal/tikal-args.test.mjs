// Tikal gets -ie/-oe UTF-8 on every call (extract and merge): the JVM of the
// container runs in ASCII and a UTF-8 .txt used to lose every non-ASCII
// character (measured 2026-10-01). node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { ENCODING_ARGS, filterArgs } from "../../lib/tikal-args.js";

test("toda llamada a Tikal lleva -ie/-oe UTF-8", () => {
  assert.deepEqual(ENCODING_ARGS, ["-ie", "UTF-8", "-oe", "UTF-8"]);
  for (const fc of ["okf_plaintext", "okf_po", "okf_openxml@pdocs", "okf_openoffice", "okf_idml"]) {
    const args = filterArgs(fc);
    assert.deepEqual(args.slice(0, 2), ["-fc", fc]);
    const i = args.indexOf("-ie");
    assert.equal(args[i + 1], "UTF-8", fc);
    assert.equal(args[args.indexOf("-oe") + 1], "UTF-8", fc);
  }
});

test("un filtro personalizado (name@variant) sigue llevando su -pd", () => {
  const args = filterArgs("okf_openxml@pdocs");
  assert.ok(args.includes("-pd"));
  assert.match(args[args.indexOf("-pd") + 1], /okapi[\\/]filters$/);
  assert.ok(!filterArgs("okf_plaintext").includes("-pd"));
});
