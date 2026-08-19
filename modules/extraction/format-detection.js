import { HttpError } from "@/modules/shared";

const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const OLE_MAGIC = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const PDF_MAGIC = Buffer.from("%PDF-");

const OOXML_EXTENSIONS = [
  ".docx", ".docm", ".dotx", ".dotm",
  ".pptx", ".pptm", ".potx", ".potm", ".ppsx", ".ppsm",
  ".xlsx", ".xlsm", ".xltx", ".xltm",
];
const ODF_EXTENSIONS = [".odt", ".ott", ".ods", ".ots", ".odp", ".otp", ".odg", ".otg"];
const TEXT_EXTENSIONS = [".txt", ".po"];

/**
 * Identifies the document format from its magic bytes, so a renamed legacy
 * binary (.doc saved as .docx) fails fast instead of deep inside Tikal.
 * Throws HttpError(415) on mismatch.
 */
export function detectDocumentFormat(content, extension) {
  const ext = extension.toLowerCase();
  if (ext === ".pdf") {
    if (!content.subarray(0, 5).equals(PDF_MAGIC)) {
      throw new HttpError(
        415,
        "File content does not match a PDF (missing %PDF header)",
        "UNSUPPORTED_FORMAT",
      );
    }
    return { family: "pdf" };
  }
  if (TEXT_EXTENSIONS.includes(ext)) {
    const sample = content.subarray(0, 64 * 1024);
    if (sample.includes(0)) {
      throw new HttpError(
        415,
        `File content does not look like text for "${ext}" (binary data found)`,
        "UNSUPPORTED_FORMAT",
      );
    }
    if (ext === ".po" && !/^\s*msgid\b/m.test(sample.toString("utf8"))) {
      throw new HttpError(
        415,
        "File does not look like a gettext PO catalog (no msgid entries found)",
        "UNSUPPORTED_FORMAT",
      );
    }
    return { family: ext === ".po" ? "gettext-po" : "plain-text" };
  }
  if (content.subarray(0, 8).equals(OLE_MAGIC)) {
    throw new HttpError(
      415,
      "Legacy Office 97-2003 binary format detected. Convert the file to OOXML (.docx/.xlsx/.pptx) first.",
      "UNSUPPORTED_FORMAT",
    );
  }
  if (!content.subarray(0, 4).equals(ZIP_MAGIC)) {
    throw new HttpError(
      415,
      `File content does not match a supported format for "${ext}" (not a ZIP-based document)`,
      "UNSUPPORTED_FORMAT",
    );
  }
  if (OOXML_EXTENSIONS.includes(ext)) return { family: "office-open-xml" };
  if (ODF_EXTENSIONS.includes(ext)) return { family: "open-document" };
  if (ext === ".idml") return { family: "idml" };
  throw new HttpError(
    415,
    `Unsupported extension "${ext}"`,
    "UNSUPPORTED_FORMAT",
  );
}
