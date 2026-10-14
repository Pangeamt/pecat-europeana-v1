// Where the uploaded documents live. Pure (node builtins and `uid` only) so
// node:test loads it.
//
// The originals are kept OUTSIDE public/: Next serves everything under
// public/ to anyone with the URL, and the app never needs these files by URL.
// Every download reads them from disk, behind the document's permissions.
//
// Documents uploaded before the move keep `./public/files/<name>` in
// Document.filePath (and so do import jobs still in the queue): those paths
// are resolved into UPLOADS_DIR when read, with no database change.
import { basename, join } from "path";
import { uid } from "uid";

const LEGACY_PREFIXES = ["./public/files/", "public/files/"];

/** The folder with the uploaded originals (`UPLOADS_DIR`, or ./uploads). */
export const uploadsDir = () => process.env.UPLOADS_DIR || join(process.cwd(), "uploads");

/** Where a new upload is written: `<UPLOADS_DIR>/<uid>_<name>`. */
export const newUploadPath = (name) => join(uploadsDir(), `${uid()}_${name}`);

/** The path to read a stored `filePath` from (legacy ones mapped into UPLOADS_DIR). */
export function resolveUploadPath(filePath) {
  const value = String(filePath ?? "");
  const normalized = value.replace(/\\/g, "/");
  if (LEGACY_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return join(uploadsDir(), basename(normalized));
  }
  return value;
}
