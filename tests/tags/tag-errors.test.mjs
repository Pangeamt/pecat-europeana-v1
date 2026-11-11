// Finding the segments with tag errors (lib/tag-errors.js): the editor's red
// banner counts them, and its "Show segments" button and the status filter's
// "Tag errors" option list exactly the same segments.
// node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { hasTagError } from "../../lib/tag-errors.js";
import { STATUS_FILTER_VALUES, matchesStatusSelection } from "../../lib/segment-status.js";

const require = createRequire(import.meta.url);
const SRC = "Save <g1>the file</g1> now<x2/>";
const tu = (fields) => ({
  srcLiteral: SRC,
  translatedLiteral: "Guarde <g1>el fichero</g1> ahora<x2/>",
  reviewLiteral: null,
  Status: "TRANSLATED_MT",
  visible: true,
  block: false,
  ...fields,
});

test("hasTagError: a saved target whose tags do not match the source", () => {
  assert.equal(hasTagError(tu({})), false, "same tags");
  assert.equal(hasTagError(tu({ translatedLiteral: "Guarde el fichero ahora<x2/>" })), true, "missing pair");
  assert.equal(hasTagError(tu({ translatedLiteral: "Guarde <g1>el fichero</g1> ahora<x2/><x3/>" })), true, "extra tag");
  // The confirmed text counts, not the MT underneath it.
  assert.equal(hasTagError(tu({ translatedLiteral: "Guarde el fichero", reviewLiteral: "Guarde <g1>el fichero</g1> ahora<x2/>" })), false);
  assert.equal(hasTagError(tu({ reviewLiteral: "Guarde el fichero ahora" })), true);
});

test("hasTagError: what the banner leaves out", () => {
  const broken = { translatedLiteral: "Guarde el fichero ahora" };
  assert.equal(hasTagError(tu({ ...broken, visible: false })), false, "hidden segment");
  assert.equal(hasTagError(tu({ ...broken, block: true })), false, "locked segment");
  assert.equal(hasTagError(tu({ translatedLiteral: null })), false, "nothing translated yet");
  assert.equal(hasTagError(tu({ srcLiteral: "Save the file", translatedLiteral: "Guarde <g1>el</g1> fichero" })), false, "source without tags");
  assert.equal(hasTagError(null), false);
});

test("status filter «Tag errors»: the same segments the banner counts", () => {
  const rows = [
    tu({}),
    tu({ translatedLiteral: "Guarde el fichero ahora" }),
    tu({ translatedLiteral: "Guarde el fichero ahora", Status: "ACCEPTED", reviewLiteral: "Guarde el fichero ahora", reviewedAt: new Date() }),
    tu({ translatedLiteral: "Guarde el fichero ahora", block: true }),
  ];
  const context = { tagError: (row) => hasTagError(row) };
  const banner = rows.filter(context.tagError);
  const listed = rows.filter((row) => matchesStatusSelection(["TAG_ERROR"], row, context));
  assert.deepEqual(listed, banner);
  assert.equal(listed.length, 2);
  // Groups narrow each other: tag errors AND not reviewed.
  assert.deepEqual(rows.filter((row) => matchesStatusSelection(["TAG_ERROR", "NOT_REVIEWED"], row, context)), [rows[1]]);
  // Without the check (no document format known) the option lets nothing through.
  assert.equal(matchesStatusSelection(["TAG_ERROR"], rows[1]), false);
  assert.equal(matchesStatusSelection([], rows[1]), true, "empty selection lets everything through");
});

test("every status filter option has a label in English and Spanish", () => {
  for (const language of ["en", "es"]) {
    const labels = require(`../../lib/i18n/locales/${language}.json`).tus.status;
    for (const value of STATUS_FILTER_VALUES) {
      assert.ok(labels[value], `${language}: tus.status.${value}`);
    }
  }
});
