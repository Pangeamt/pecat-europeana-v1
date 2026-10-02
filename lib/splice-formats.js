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
// DAAIT /content/pecat). All three bilingual formats are (decision of
// 2026-10-02, reversing the 2026-10-01 one that left .xlf/.xliff empties for a
// human): what the client already translated is reviewed as is, and the empty
// segments are translated in sequential batches of 50 (DAAIT_PECAT_BATCH_SIZE),
// so a document with hundreds of empties no longer risks a single 300 s request.
export const translatesEmptiesOnImport = (extension) => isSpliceFormat(extension);
