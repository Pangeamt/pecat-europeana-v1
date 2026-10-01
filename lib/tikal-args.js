import { join } from "path";

// Pure (no alias imports) so node:test can load it. The filter arguments Tikal
// gets on EVERY call, extract (-x) and merge (-m).
//
// `-ie UTF-8 -oe UTF-8` always, as module-file-translate does (app/xliff/tikal.py:
// "sin ellos Okapi destroza los acentos cuando el charset por defecto de la JVM
// no es UTF-8"). Measured on the PECAT-E container (2026-10-01): its JVM runs
// with file.encoding=ANSI_X3.4-1968 (ASCII, no LANG), so a UTF-8 .txt lost every
// non-ASCII character on extraction (stored as U+FFFD). Formats that carry
// their own encoding (ZIP+XML such as .docx/.xlsx, or a PO with a charset
// header) were never affected; the flags do not change them.
const FILTERS_DIR = join(process.cwd(), "okapi", "filters");

export const ENCODING_ARGS = ["-ie", "UTF-8", "-oe", "UTF-8"];

// -pd is only needed for custom configs ("name@variant"), whose .fprm must be on disk.
export function filterArgs(filterConfig) {
  const args = ["-fc", filterConfig, ...ENCODING_ARGS];
  if (filterConfig.includes("@")) {
    args.push("-pd", FILTERS_DIR);
  }
  return args;
}
