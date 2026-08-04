import { execFile } from "child_process";
import { access, mkdir, rm } from "fs/promises";
import { basename, dirname, extname, join } from "path";
import { pathToFileURL } from "url";
import { promisify } from "util";
import { HttpError } from "@/modules/shared/http-error";

const execFileAsync = promisify(execFile);

/**
 * Converts documents with LibreOffice headless. Used as the pre-step for PDF
 * uploads: PDF -> .docx, which then goes through the normal Tikal pipeline.
 * Converts `filePath` to .docx in the same directory and returns the new path.
 */
export async function convertPdfToDocx(filePath) {
  const bin = process.env.SOFFICE_BIN || "soffice";
  const parsedTimeout = Number(process.env.SOFFICE_TIMEOUT_MS);
  const timeout =
    Number.isFinite(parsedTimeout) && parsedTimeout > 0
      ? parsedTimeout
      : 180_000;
  const dir = dirname(filePath);
  // Concurrent soffice instances clash on the shared user profile; give each
  // conversion its own profile dir. Unique per attempt: a stale lock from a
  // timeout-killed previous run would make the retry fail or silently no-op.
  const profileDir = join(dir, `.soffice-profile-${Date.now()}`);
  await mkdir(profileDir, { recursive: true });

  try {
    const { stdout, stderr } = await execFileAsync(
      bin,
      [
        "--headless",
        `-env:UserInstallation=${pathToFileURL(profileDir).href}`,
        // Open the PDF in Writer: without this it opens in Draw, which has
        // no docx export filter ("Error: no export filter").
        "--infilter=writer_pdf_import",
        "--convert-to",
        "docx:MS Word 2007 XML",
        "--outdir",
        dir,
        filePath,
      ],
      { cwd: dir, timeout, maxBuffer: 16 * 1024 * 1024 },
    );
    console.log(
      `[soffice] convert ${basename(filePath)} -> docx: ${stdout.trim() || stderr.trim()}`,
    );
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new HttpError(
        503,
        `LibreOffice not found at "${bin}". Install it (e.g. brew install --cask libreoffice) and/or set SOFFICE_BIN.`,
        "SOFFICE_UNAVAILABLE",
      );
    }
    if (error?.killed) {
      // Deterministic for a given file: the import job must not retry it.
      throw new HttpError(
        500,
        `LibreOffice conversion timed out after ${timeout} ms`,
        "DOCUMENT_EXTRACTION_TIMEOUT",
      );
    }
    throw new HttpError(
      500,
      `LibreOffice conversion failed: ${String(error?.stderr || error?.stdout || error).trim().split("\n").slice(-4).join("\n")}`,
      "SOFFICE_ERROR",
    );
  } finally {
    await rm(profileDir, { recursive: true, force: true }).catch(() => undefined);
  }

  const outPath = join(dir, `${basename(filePath, extname(filePath))}.docx`);
  try {
    await access(outPath);
  } catch {
    // soffice exits 0 on some failures (e.g. missing PDF import filter).
    throw new HttpError(
      500,
      "LibreOffice reported success but produced no .docx (is the PDF import filter available?)",
      "SOFFICE_ERROR",
    );
  }
  return outPath;
}
