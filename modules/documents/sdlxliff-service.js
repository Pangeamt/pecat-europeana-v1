import { UnrecoverableError } from 'bullmq';
import { HttpError } from '../shared/http-error';
import { pecatTranslate } from '../../lib/daait';
import { BLOCK_REASON } from './pipeline-constants';
import { tagIssue } from './tag-check';
import { needsMachineTranslation } from '../../lib/splice-formats';
import { readSdlxliffSegments } from './sdlxliff/reader';
import { writeSdlxliff } from './sdlxliff/writer';

// SDLXLIFF import/export (2026-09-30): the model of module-file-translate
// (app/xliff/sdl_merge.py), see modules/documents/sdlxliff/*. Before this the
// import flattened every inline tag and the export rebuilt the WHOLE file
// with xml2js -- which reordered mixed content in every source/seg-source,
// exported the MT instead of the review (H-1) and matched segments by source
// text. Audit: documentacion/pecat-e/COMPARATIVA-SDLXLIFF-PECATE-VS-MFT.md.

export async function parseSdlxliffFile(filePath) {
  const fs = await import('fs');
  // "utf8" keeps the BOM (the reader skips it as a text node).
  const buffer = fs.readFileSync(filePath);
  const fileContent = buffer.toString('utf8');
  // The file is spliced back as UTF-8 text: any other encoding would be read
  // as garbage and written back corrupted, so it is refused up front.
  const utf16 = (buffer[0] === 0xff && buffer[1] === 0xfe) || (buffer[0] === 0xfe && buffer[1] === 0xff);
  const head = fileContent.slice(0, 300).replace(/^[^<]+/, ""); // drops the BOM
  const declared = /^<\?xml[^>]*\bencoding\s*=\s*["']([^"']+)["']/i.exec(head)?.[1];
  if (utf16 || (declared && !/^(utf-?8|us-ascii)$/i.test(declared))) {
    throw new HttpError(
      400,
      `Unsupported encoding (${utf16 ? 'UTF-16' : declared}): the XLIFF file must be UTF-8.`,
    );
  }

  let parsed;
  try {
    parsed = readSdlxliffSegments(fileContent);
  } catch (error) {
    throw new HttpError(400, `Invalid SDLXLIFF file format: ${error?.message ?? error}`);
  }
  const { sourceLanguage, targetLanguage, segments } = parsed;

  // Only source-language is required in the file. target-language is optional:
  // source-only SDLXLIFF (no target language assigned yet in Trados) is valid;
  // the target is then taken from the upload form (`tgt`).
  if (!sourceLanguage) {
    throw new HttpError(400, 'SDLXLIFF file must specify a source-language attribute.');
  }
  if (segments.length === 0) {
    throw new HttpError(400, 'No translation units found in SDLXLIFF file.');
  }

  // The header tags as written ("en-US"): the importer turns them into DAAIT
  // catalog codes (`resolveDaaitLanguageTag`). Cutting them to the primary
  // subtag here sent "en" for an "en-GB" file, a different language for DAAIT.
  return {
    sourceLanguage: sourceLanguage.trim(),
    targetLanguage: targetLanguage ? targetLanguage.trim() : null,
    segments,
  };
}

// DAAIT /content/pecat gets the texts in BATCHES of 50, one after the other (the
// next batch goes out when the previous one has answered), not in one request.
// Measured on vstest02: ~1 s per segment (62 segments = 62 s, 42 tag-heavy ones
// = 197 s), so a single request carrying a big document ran into the 300 s
// timeout of the call. Each batch is its own request with its own timeout
// (DAAIT_CONTENT_TIMEOUT_MS) and is applied as soon as it comes back. Every
// request carries the document id (and the filestore id when there is one) and
// the last batch says so (last_batch), so DAAIT's volatile memory -- what the
// first 50 segments produced, feeding the next 50 -- can work per document.
const PECAT_BATCH_SIZE = (() => {
  const parsed = Math.floor(Number(process.env.DAAIT_PECAT_BATCH_SIZE));
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 50;
})();

// Machine-translate parsed segments in place through DAAIT /content/pecat
// (the NexRelay replacement); locked segments are never touched. A translation
// failure aborts the import (the document would miss targets). MTQE scoring is
// no longer inline — /content/pecat returns no score, so the score-mtqe
// pipeline job (pipeline-service.js) scores every segment once the TUs are
// persisted, including SDLXLIFF segments that already carried a target.
// `machineTranslate: false` sends NOTHING to DAAIT: the empty targets stay empty.
export async function enrichSdlxliffSegments(segments, {
  sourceLanguage,
  targetLanguage,
  tmIds = [],
  glossaryIds = [],
  profileId = null,
  workspaceId = null,
  orderedTags = false,
  machineTranslate = true,
  documentId = null,
  filestoreId = null,
  // Called with { done, total } (segments sent to DAAIT) before the first
  // batch and after each one: what the documents list shows while the file
  // is still processing. Its failures never touch the import.
  onProgress = null,
} = {}) {
  // The file store's id IS the document's identity for DAAIT: it goes as
  // `document_id` (the key of its volatile memory and of the Langfuse
  // session), so every batch of the same file shares it. Formats that never
  // go through the file store (.sdlxliff/.xlf) fall back to the document id.
  const daaitDocumentId = filestoreId ?? documentId;

  // Hidden segments (visibility rules, e.g. URL-only footnotes) are never
  // machine-translated: their target stays empty and the export fills them
  // back from the source.
  const toTranslate = machineTranslate
    ? segments.filter(needsMachineTranslation)
    : [];

  function applyResult(seg, result) {
    const tmInfoArray = Array.isArray(result.tm_info) ? result.tm_info : [];
    const exactTm = tmInfoArray.find(
      (tm) => tm.tm_match === true && tm.tm_score === 1,
    );
    // "Fuzzy" = the segment's best TM similarity (tm_score, 0-1), exact or
    // not — storing it only for 100% matches left the Fuzzy column empty
    // for every fuzzy match, which is exactly where it matters.
    const bestScore = tmInfoArray.reduce(
      (max, tm) =>
        typeof tm?.tm_score === "number" && tm.tm_score > max
          ? tm.tm_score
          : max,
      null,
    );

    seg.target = result.target ?? null;
    // The source travels with its inline codes as placeholders (<g1>, <x2/>).
    // DAAIT is not guaranteed to keep them: a translation that drops or
    // invents one -- or REORDERS them -- is still stored (the reviewer can fix
    // the text), but it is flagged VALIDATION_FAILED, and the export will not
    // write it until the tags match in the same order (writer.js gate; same
    // criterion, so nothing is skipped without having been flagged first).
    seg.tagMismatch =
      Boolean(seg.target) && !tagIssue(seg.source, seg.target, { ordered: orderedTags }).ok;
    seg.tmInfo = result.tm_info ?? null;
    seg.glossaryInfo = result.glossary_info ?? null;
    seg.machineTranslated = true;
    // An exact TM match is auto-locked -- unless its tags do not match the
    // source: locked, nobody could fix it and the export would skip it
    // (revisions-pangeanic-local does not auto-lock a tagged 100% either).
    seg.tmExactMatch = Boolean(exactTm) && !seg.tagMismatch;
    seg.levenshteinDistance = bestScore;
  }

  async function translateBatch(batch, isLast) {
    const payload = {
      profile_id: profileId,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      texts: batch.map((seg) => seg.source),
      tm_ids: tmIds,
      glossary_ids: glossaryIds,
      workspace: workspaceId,
      document_id: daaitDocumentId,
      last_batch: isLast,
    };

    let response;
    try {
      response = await pecatTranslate(payload);
    } catch (error) {
      // Documents are always translated with their profile: a profile whose
      // DAAIT mirror is gone fails the import instead of translating without
      // it (the upload pre-checks this; here it only happens on a race).
      // Retrying cannot fix it, so the job fails on the spot.
      const missingProfile =
        profileId &&
        error?.status === 404 &&
        /profile/i.test(error?.message ?? '');
      if (missingProfile) {
        throw new UnrecoverableError(
          `Profile ${profileId} does not exist in DAAIT: open the profile and save it to recreate it`,
        );
      }
      throw error;
    }

    const results = response?.segments;
    if (!Array.isArray(results)) {
      throw new HttpError(502, 'Invalid response format from DAAIT /content/pecat');
    }

    // DAAIT returns one entry per input text, in the same order.
    batch.forEach((seg, index) => {
      if (results[index]) applyResult(seg, results[index]);
    });
  }

  const report = async (done) => {
    try {
      await onProgress?.({ done, total: toTranslate.length });
    } catch (error) {
      console.error('[SDLXLIFF] progress not recorded:', error.message);
    }
  };

  const batches = Math.ceil(toTranslate.length / PECAT_BATCH_SIZE);
  await report(0);
  for (let i = 0; i < batches; i++) {
    await translateBatch(
      toTranslate.slice(i * PECAT_BATCH_SIZE, (i + 1) * PECAT_BATCH_SIZE),
      i === batches - 1,
    );
    await report(Math.min((i + 1) * PECAT_BATCH_SIZE, toTranslate.length));
    console.log(`[SDLXLIFF] translated batch ${i + 1}/${batches} (document ${daaitDocumentId ?? "-"})`);
  }

  return { translated: toTranslate.length };
}

// Build Prisma `Tu` rows straight from the parsed (and optionally enriched)
// SDLXLIFF segments. externalId keeps the identity needed for a lossless
// export: "<trans-unit id>::<mrk mid>" (or just the trans-unit id when
// unsegmented). Locked segments (<sdl:seg locked="true">) are blocked from
// editing, and so are exact TM matches (tm_score === 1).
export function buildTusDataFromSdlxliffSegments(segments, documentId, sourceLanguage, targetLanguage) {
  return segments.map((seg, index) => ({
    externalId: seg.mid != null ? `${seg.transUnitId}::${seg.mid}` : seg.transUnitId,
    count: index,
    srcLiteral: seg.source,
    translatedLiteral: seg.target ?? null,
    // Scores are stored in the 0..1 scale the UI buckets expect. MTQE returns
    // 0..1; the sdl:seg `percent` attribute is 0..100.
    translationScorePercent:
      seg.mtqeScore ?? (seg.percent != null ? seg.percent / 100 : null),
    tmInfo: seg.tmInfo ?? null,
    glossaryInfo: seg.glossaryInfo ?? null,
    // Tag types for the chips (glossary, unit, &deg;...), from <tag-defs>.
    tagInfo: seg.tagInfo ?? null,
    levenshteinDistance: seg.levenshteinDistance ?? null,
    // The segment as the client's file had it: its number in the CAT tool and
    // its confirmation level / origin (the editor's status column shows them
    // until the segment is touched here). `fileTarget` tells a target the
    // client delivered from one PECAT-E's MT filled in.
    segmentNumber: seg.segmentNumber ?? null,
    fileConf: seg.conf ?? null,
    fileOrigin: seg.origin ?? null,
    filePercent: Number.isFinite(seg.percent) ? Math.round(seg.percent) : null,
    fileTextMatch: seg.textMatch ?? null,
    fileLocked: Boolean(seg.locked),
    fileTarget: Boolean(seg.target) && !seg.machineTranslated,
    visible: !seg.hiddenBy,
    hiddenBy: seg.hiddenBy ?? null,
    block: seg.locked || seg.tmExactMatch === true,
    blockReason: seg.locked
      ? BLOCK_REASON.INTERNAL
      : seg.tmExactMatch === true
        ? BLOCK_REASON.TM_MATCH
        : null,
    sourceLanguage: sourceLanguage || '',
    targetLanguage: targetLanguage || '',
    ...(seg.tagMismatch ? { daaitStatus: 'VALIDATION_FAILED' } : {}),
    Status: seg.locked || seg.tmExactMatch === true
      ? 'ACCEPTED'
      : seg.machineTranslated || seg.origin === 'mt'
        ? 'TRANSLATED_MT'
        : 'NOT_REVIEWED',
    documentId,
  }));
}

/**
 * Builds the deliverable: our translations written INTO the client's original
 * file (see sdlxliff/writer.js for the rules). Returns { text, report };
 * `report` counts what was written and what was deliberately NOT written
 * (tags that do not match the source, legacy rows imported without tags,
 * keys without place in the original, locked segments).
 */
export async function exportSdlxliffWithReport(originalFilePath, tus) {
  const fs = await import('fs');
  let raw;
  try {
    raw = fs.readFileSync(originalFilePath, 'utf8');
  } catch {
    throw new HttpError(404, 'Original SDLXLIFF file not found for export');
  }
  try {
    const { text, report } = writeSdlxliff(raw, tus);
    const skipped = skippedSegments(report);
    if (skipped) {
      console.warn(`[sdlxliff] export of ${originalFilePath}: ${skipped} segment(s) not written`, report);
    }
    return { text, report };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, `Error generating SDLXLIFF export: ${error.message}`);
  }
}

/** Segments we had a translation for but did not write (the reviewer should know). */
export function skippedSegments(report) {
  return report.skippedTags + report.skippedLegacy + report.skippedLockTu + report.noPlace;
}

export async function exportSdlxliffForDownload(originalFilePath, tus) {
  return (await exportSdlxliffWithReport(originalFilePath, tus)).text;
}
