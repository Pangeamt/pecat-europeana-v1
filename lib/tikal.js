import { execFile } from "child_process";
import { access } from "fs/promises";
import { basename, dirname, extname, join } from "path";
import { promisify } from "util";
import { HttpError } from "@/modules/shared/http-error";

const execFileAsync = promisify(execFile);

// Okapi Tikal CLI: document -> bilingual XLIFF 1.2 (-x) and back (-m).
// Assets (custom .fprm filter params and the SRX sentence-segmentation rules)
// live under <project root>/okapi and are resolved from cwd — the app always
// runs with cwd = project root (PM2 cwd/Docker WORKDIR).
const FILTERS_DIR = join(process.cwd(), "okapi", "filters");
const SRX_PATH = join(process.cwd(), "okapi", "srx", "pdocs.srx");

// Same filter config must be used for extract AND merge, otherwise Okapi could
// apply different rules when re-injecting the translation.
export const FILTER_BY_EXT = {
  // Office Open XML: documents, templates (t) and macro-enabled (m) variants
  // all share the same ZIP+XML structure, so the pdocs filter applies to all.
  ".docx": "okf_openxml@pdocs",
  ".docm": "okf_openxml@pdocs",
  ".dotx": "okf_openxml@pdocs",
  ".dotm": "okf_openxml@pdocs",
  ".pptx": "okf_openxml@pdocs",
  ".pptm": "okf_openxml@pdocs",
  ".potx": "okf_openxml@pdocs",
  ".potm": "okf_openxml@pdocs",
  ".ppsx": "okf_openxml@pdocs",
  ".ppsm": "okf_openxml@pdocs",
  ".xlsx": "okf_openxml@pdocs",
  ".xlsm": "okf_openxml@pdocs",
  ".xltx": "okf_openxml@pdocs",
  ".xltm": "okf_openxml@pdocs",
  // OpenDocument: text/spreadsheet/presentation/graphics and their templates.
  ".odt": "okf_openoffice",
  ".ott": "okf_openoffice",
  ".ods": "okf_openoffice",
  ".ots": "okf_openoffice",
  ".odp": "okf_openoffice",
  ".otp": "okf_openoffice",
  ".odg": "okf_openoffice",
  ".otg": "okf_openoffice",
  // Text-based formats.
  ".txt": "okf_plaintext",
  ".po": "okf_po",
  // Adobe InDesign package (ZIP-based).
  ".idml": "okf_idml",
};

export function filterForExtension(extension) {
  const filter = FILTER_BY_EXT[extension.toLowerCase()];
  if (!filter) {
    throw new HttpError(
      415,
      `Unsupported extension "${extension}". Supported: ${Object.keys(FILTER_BY_EXT).join(", ")}`,
      "UNSUPPORTED_FORMAT",
    );
  }
  return filter;
}

// -pd is only needed for custom configs ("name@variant"), whose .fprm must be on disk.
function filterArgs(filterConfig) {
  const args = ["-fc", filterConfig];
  if (filterConfig.includes("@")) {
    args.push("-pd", FILTERS_DIR);
  }
  return args;
}

/**
 * document -> bilingual XLIFF, written next to the input as `<name>.<ext>.xlf`.
 * Extraction segments by sentence (SRX): each trans-unit carries a
 * <seg-source> with one <mrk mtype="seg"> per sentence.
 */
export async function tikalExtract(filePath, sourceLang, targetLang) {
  const filter = filterForExtension(extname(filePath));
  // Tikal is always run with cwd = the file's directory and bare filenames,
  // so its outputs land next to the original. -nocopy: without it Tikal
  // pre-fills every <target> with a copy of the source, making translated
  // and untranslated segments indistinguishable.
  await run(
    [
      "-x",
      basename(filePath),
      "-sl",
      sourceLang,
      "-tl",
      targetLang,
      "-nocopy",
      "-seg",
      SRX_PATH,
      ...filterArgs(filter),
    ],
    dirname(filePath),
  );
  const xlfPath = `${filePath}.xlf`;
  await ensureExists(xlfPath, "Tikal reported success but no XLIFF was produced");
  return xlfPath;
}

/**
 * bilingual XLIFF -> translated document (`<stem>.out.<ext>`).
 * The original file must still sit next to the .xlf for the merge to work.
 */
export async function tikalMerge(xlfPath) {
  const originalPath = xlfPath.replace(/\.xlf$/i, "");
  const extension = extname(originalPath);
  const filter = filterForExtension(extension);
  await ensureExists(
    originalPath,
    `Original file ${basename(originalPath)} must sit next to the XLIFF for merging`,
  );
  await run(["-m", basename(xlfPath), ...filterArgs(filter)], dirname(xlfPath));
  const outPath = join(
    dirname(originalPath),
    `${basename(originalPath, extension)}.out${extension}`,
  );
  await ensureExists(
    outPath,
    "Tikal reported success but no merged document was produced",
  );
  return outPath;
}

async function ensureExists(path, message) {
  try {
    await access(path);
  } catch {
    throw new HttpError(500, message, "TIKAL_ERROR");
  }
}

// Each Tikal run is a JVM; cap concurrent spawns so a burst of jobs cannot
// exhaust memory.
let running = 0;
const waiters = [];

function maxConcurrency() {
  const parsed = Number(process.env.TIKAL_MAX_CONCURRENCY);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 2;
}

async function acquire() {
  if (running < maxConcurrency()) {
    running++;
    return;
  }
  await new Promise((resolve) => waiters.push(resolve));
  running++;
}

function release() {
  running--;
  waiters.shift()?.();
}

async function run(args, cwd) {
  await acquire();
  try {
    await runUnlocked(args, cwd);
  } finally {
    release();
  }
}

async function runUnlocked(args, cwd) {
  const bin = process.env.TIKAL_BIN || "tikal";
  const parsedTimeout = Number(process.env.TIKAL_TIMEOUT_MS);
  const timeout =
    Number.isFinite(parsedTimeout) && parsedTimeout > 0
      ? parsedTimeout
      : 300_000;
  console.log(`[tikal] ${args.join(" ")} (cwd=${cwd})`);
  try {
    const { stdout, stderr } = await execFileAsync(bin, args, {
      cwd,
      timeout,
      maxBuffer: 16 * 1024 * 1024,
    });
    // Tikal can exit 0 while still printing an error banner.
    if (/^Error\b|\nError\b/m.test(`${stdout}\n${stderr}`)) {
      throw new HttpError(500, `Tikal error: ${tail(stdout || stderr)}`, "TIKAL_ERROR");
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error?.code === "ENOENT") {
      throw new HttpError(
        503,
        `Tikal binary not found at "${bin}". Install the Okapi Framework and set TIKAL_BIN (Java is required).`,
        "TIKAL_UNAVAILABLE",
      );
    }
    if (error?.killed) {
      // Deterministic for a given file: the import job must not retry it.
      throw new HttpError(
        500,
        `Tikal timed out after ${timeout} ms`,
        "DOCUMENT_EXTRACTION_TIMEOUT",
      );
    }
    throw new HttpError(
      500,
      `Tikal failed (exit ${error?.code}): ${tail(error?.stderr || error?.stdout || String(error))}`,
      "TIKAL_ERROR",
    );
  }
}

function tail(text, lines = 6) {
  return String(text).trim().split("\n").slice(-lines).join("\n");
}
