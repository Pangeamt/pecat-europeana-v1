// Bilingual XLIFF files the client already owns: our translations are written
// INTO the original file (modules/documents/sdlxliff/writer.js), not through
// Tikal. Measured on the client's real .xlf/.xliff: a Tikal round trip fills
// empty targets with the source, mangles non-ASCII (no -ie/-oe UTF-8) and
// reformats the file. Pure module (no imports) so node:test can load it;
// lib/utils.js re-exports it.
export const SPLICE_EXTENSIONS = new Set(["sdlxliff", "xlf", "xliff"]);

export const isSpliceFormat = (extension) =>
  SPLICE_EXTENSIONS.has(String(extension ?? "").toLowerCase().replace(/^\./, ""));

// Whether the EMPTY targets of an imported file are machine-translated (sent to
// DAAIT /content/pecat). .xlf/.xliff are the client's own bilingual files: what
// they already translated is reviewed as is and the empty segments stay empty
// for a human -- nothing is sent to DAAIT for them (decision of 2026-10-01; it
// also avoids one 300 s request carrying hundreds of segments). .sdlxliff keeps
// the previous behaviour (empties are machine-translated).
export const translatesEmptiesOnImport = (extension) =>
  String(extension ?? "").toLowerCase().replace(/^\./, "") === "sdlxliff";
