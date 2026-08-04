import { randomUUID } from "crypto";
import fs from "fs";
import { basename, extname, join } from "path";
import { uid } from "uid";
import contentDisposition from "content-disposition";
import { HttpError } from "@/modules/shared";
// Direct file import on purpose: going through @/modules/projects would close
// an import cycle (projects barrel -> import-service -> this module).
import { exportSdlxliffForDownload } from "@/modules/projects/sdlxliff-service";
import { detectDocumentFormat } from "./format-detection";
import {
  listXliffSegments,
  prepareXliffForMerge,
  TOKEN_RE,
  updateXliffTargets,
} from "./xliff";
import {
  convertPdfDocumentToDocx,
  extractToXliff,
  findProjectById,
  findProjectForActor,
  findTusByProjectId,
  mergeFromXliff,
  updateProjectById,
} from "./repository";

// Working folders live in this project: storage/{documentId}/ holds the
// original file, the LibreOffice conversion (PDFs) and the bilingual XLIFF —
// the source of truth the export merges from.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const METADATA_FILE = "metadata.json";

const MEDIA_TYPES = {
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".docm": "application/vnd.ms-word.document.macroEnabled.12",
  ".dotx": "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  ".dotm": "application/vnd.ms-word.template.macroEnabled.12",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xlsm": "application/vnd.ms-excel.sheet.macroEnabled.12",
  ".xltx": "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
  ".xltm": "application/vnd.ms-excel.template.macroEnabled.12",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".pptm": "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
  ".potx": "application/vnd.openxmlformats-officedocument.presentationml.template",
  ".potm": "application/vnd.ms-powerpoint.template.macroEnabled.12",
  ".ppsx": "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
  ".ppsm": "application/vnd.ms-powerpoint.slideshow.macroEnabled.12",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".ott": "application/vnd.oasis.opendocument.text-template",
  ".ods": "application/vnd.oasis.opendocument.spreadsheet",
  ".ots": "application/vnd.oasis.opendocument.spreadsheet-template",
  ".odp": "application/vnd.oasis.opendocument.presentation",
  ".otp": "application/vnd.oasis.opendocument.presentation-template",
  ".odg": "application/vnd.oasis.opendocument.graphics",
  ".otg": "application/vnd.oasis.opendocument.graphics-template",
  ".txt": "text/plain; charset=utf-8",
  ".po": "text/x-gettext-translation; charset=utf-8",
  ".idml": "application/vnd.adobe.indesign-idml-package",
};

function storageDir() {
  return process.env.STORAGE_DIR || join(process.cwd(), "storage");
}

function documentDir(documentId) {
  if (!UUID_RE.test(documentId)) {
    throw new HttpError(404, `Document "${documentId}" not found`);
  }
  return join(storageDir(), documentId);
}

async function readDocumentMetadata(documentId) {
  try {
    const raw = await fs.promises.readFile(
      join(documentDir(documentId), METADATA_FILE),
      "utf8",
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Serializes mutating operations per document: two concurrent exports of the
// same project would otherwise write the same .xlf while Tikal reads it.
const locks = new Map();

function withDocumentLock(documentId, fn) {
  const prev = locks.get(documentId) ?? Promise.resolve();
  const run = prev.then(fn, fn);
  const tail = run.catch(() => undefined);
  locks.set(documentId, tail);
  void tail.then(() => {
    if (locks.get(documentId) === tail) locks.delete(documentId);
  });
  return run;
}

/**
 * Extracts a document to sentence segments with Okapi, entirely inside this
 * project: creates storage/{id}/, copies the upload as original.<ext> (fixed
 * internal name — a user filename starting with "-" would be parsed by the
 * Tikal CLI as an option), converts PDFs to .docx with LibreOffice, runs
 * `tikal -x` with SRX segmentation and returns the XLIFF segments. Sources
 * carry inline-code placeholders (<g1>…</g1>, <x2/>, <b1/>, <e1/>) that must
 * reach the translated target unchanged; ids are `<transUnit>::<mid>`.
 */
export async function extractDocumentSegmentsService({
  filePath,
  filename,
  sourceLang,
  targetLang,
}) {
  const uploadExtension = extname(filename || filePath).toLowerCase();
  const documentId = randomUUID();
  const dir = documentDir(documentId);
  await fs.promises.mkdir(dir, { recursive: true });

  try {
    const storedName = `original${uploadExtension}`;
    await fs.promises.copyFile(filePath, join(dir, storedName));

    // Magic-byte check on the first 64 KB: a renamed .doc/.xls fails fast
    // here (415) instead of with an opaque Tikal error.
    const head = await readHead(join(dir, storedName), 64 * 1024);
    detectDocumentFormat(head, uploadExtension);

    let workingName = storedName;
    if (uploadExtension === ".pdf") {
      const docxPath = await convertPdfDocumentToDocx(join(dir, storedName));
      workingName = basename(docxPath);
    }

    const xlfPath = await extractToXliff(
      join(dir, workingName),
      sourceLang,
      targetLang,
    );
    const segments = await listXliffSegments(xlfPath);

    // A converted PDF with zero translatable segments is almost certainly a
    // scanned (image-only) PDF: LibreOffice produced a docx of pictures.
    if (uploadExtension === ".pdf" && segments.length === 0) {
      throw new HttpError(
        422,
        "El PDF no contiene texto extraíble (¿documento escaneado?). Requiere OCR antes de poder traducirse.",
        "DOCUMENT_EXTRACTION_ERROR",
      );
    }

    await fs.promises.writeFile(
      join(dir, METADATA_FILE),
      JSON.stringify(
        {
          id: documentId,
          filename,
          storedName,
          workingName,
          extension: extname(workingName).toLowerCase(),
          sourceLang,
          targetLang,
          segmentCount: segments.length,
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    return { documentId, segments };
  } catch (error) {
    await fs.promises
      .rm(dir, { recursive: true, force: true })
      .catch(() => undefined);
    throw error;
  }
}

async function readHead(filePath, bytes) {
  const handle = await fs.promises.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(bytes);
    const { bytesRead } = await handle.read(buffer, 0, bytes, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

/** Links a local document folder to a project (needed to rebuild the file). */
export async function linkProjectDocumentService(projectId, documentId) {
  await updateProjectById(projectId, { documentId });
}

/** Idempotent cleanup of a document working folder. */
export async function deleteProjectDocumentService(documentId) {
  if (!documentId || !UUID_RE.test(documentId)) return;
  await fs.promises
    .rm(join(storageDir(), documentId), { recursive: true, force: true })
    .catch(() => undefined);
}

/**
 * Target updates are all-or-nothing: one target with broken inline codes
 * rejects the whole batch. This pre-validation (same multiset of codes,
 * balanced <g> nesting) lets the export skip invalid targets instead — the
 * merge then falls back to the source text for those segments.
 */
export function hasSameInlineCodes(source, target) {
  const sourceTokens = [...String(source).matchAll(TOKEN_RE)].map(
    (match) => match[0],
  );
  const targetMatches = [...String(target).matchAll(TOKEN_RE)];

  const counts = new Map();
  for (const token of sourceTokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  for (const match of targetMatches) {
    const token = match[0];
    const remaining = counts.get(token);
    if (!remaining) return false;
    counts.set(token, remaining - 1);
  }
  for (const remaining of counts.values()) {
    if (remaining !== 0) return false;
  }

  const stack = [];
  for (const [, closing, letter, num, selfClosing] of targetMatches) {
    if (letter !== "g" || selfClosing) continue;
    if (closing) {
      if (stack.pop() !== `g${num}`) return false;
    } else {
      stack.push(`g${num}`);
    }
  }
  return stack.length === 0;
}

/**
 * Builds the target updates from the project TUs: the reviewed text wins over
 * the machine translation; TUs without a segment id or with broken inline
 * codes are skipped (counted in `skipped`).
 */
export function buildSegmentUpdatesFromTus(tus) {
  const updates = [];
  let skipped = 0;
  for (const tu of tus) {
    if (!tu.externalId) continue;
    const target = tu.reviewLiteral || tu.translatedLiteral;
    if (!target) continue;
    if (!hasSameInlineCodes(tu.srcLiteral, target)) {
      skipped += 1;
      continue;
    }
    updates.push({ id: tu.externalId, target });
  }
  return { updates, skipped };
}

export async function generateProjectShareUuidService(projectId, actorUser) {
  const project = await findProjectForActor(projectId, actorUser);
  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  const uuid = uid();
  await updateProjectById(projectId, {
    uuid,
    accessDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return uuid;
}

export async function buildProjectDownloadService({ uuid, projectId }) {
  if (!uuid || !projectId) {
    throw new HttpError(400, "uuid or projectId is required");
  }

  const project = await findProjectById(projectId);
  if (!project || project.uuid !== uuid) {
    throw new HttpError(404, "Project not found");
  }

  const accessDeadline = new Date(project.accessDeadline);
  if (accessDeadline < new Date()) {
    throw new HttpError(401, "The link has expired");
  }

  const tus = await findTusByProjectId(project.id);

  // SDLXLIFF: fill the original file's <target> segments locally. Uses raw tus
  // matched by source text.
  if (project.extension === "sdlxliff") {
    const xml = await exportSdlxliffForDownload(project.filePath, tus);
    return {
      body: Buffer.from(xml, "utf8"),
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": contentDisposition(project.filename),
      },
    };
  }

  // Every other format: write the reviewed targets into the stored XLIFF and
  // let Okapi rebuild the original document (tikal -m).
  if (!project.documentId) {
    throw new HttpError(
      409,
      "This project has no document working folder (it was imported with a previous pipeline). Re-import the file to enable downloads.",
      "DOCUMENT_NOT_LINKED",
    );
  }
  const metadata = await readDocumentMetadata(project.documentId);
  if (!metadata) {
    throw new HttpError(
      409,
      "The document working folder is missing. Re-import the file to enable downloads.",
      "DOCUMENT_NOT_LINKED",
    );
  }

  return withDocumentLock(project.documentId, async () => {
    const dir = documentDir(project.documentId);
    const xlfPath = join(dir, `${metadata.workingName}.xlf`);

    const { updates, skipped } = buildSegmentUpdatesFromTus(tus);
    if (skipped > 0) {
      console.warn(
        `[documents] Project ${project.id}: ${skipped} segment(s) skipped on export (broken inline codes); their source text will be kept`,
      );
    }
    if (updates.length > 0) {
      await updateXliffTargets(xlfPath, updates);
    }
    await prepareXliffForMerge(xlfPath);

    const outPath = await mergeFromXliff(xlfPath);
    const body = await fs.promises.readFile(outPath);

    // For PDFs the deliverable is the LibreOffice .docx conversion, so the
    // download name follows the working extension, not the upload one.
    const workingExtension = extname(metadata.workingName).toLowerCase();
    const stem = basename(project.filename, extname(project.filename));
    const downloadName = `${stem}-${project.targetLanguage || "translated"}${workingExtension}`;

    return {
      body,
      headers: {
        "Content-Type": MEDIA_TYPES[workingExtension] ?? "application/octet-stream",
        "Content-Disposition": contentDisposition(downloadName),
      },
    };
  });
}
