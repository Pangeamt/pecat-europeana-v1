import { UnrecoverableError } from 'bullmq';
import { HttpError } from '../shared/http-error';
import { pecatTranslate } from '../../lib/daait';
import { BLOCK_REASON, inlineTagsMatch } from './pipeline-constants';
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
  const fileContent = fs.readFileSync(filePath, 'utf8');

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

  return {
    sourceLanguage: sourceLanguage.split('-')[0].toLowerCase(),
    targetLanguage: targetLanguage ? targetLanguage.split('-')[0].toLowerCase() : null,
    segments,
  };
}

// Machine-translate parsed segments in place through DAAIT /content/pecat
// (the NexRelay replacement); locked segments are never touched. A translation
// failure aborts the import (the document would miss targets). MTQE scoring is
// no longer inline — /content/pecat returns no score, so the score-mtqe
// pipeline job (pipeline-service.js) scores every segment once the TUs are
// persisted, including SDLXLIFF segments that already carried a target.
export async function enrichSdlxliffSegments(segments, {
  sourceLanguage,
  targetLanguage,
  tmIds = [],
  glossaryIds = [],
  profileId = null,
  workspaceId = null,
} = {}) {
  // Hidden segments (visibility rules, e.g. URL-only footnotes) are never
  // machine-translated: their target stays empty and the export fills them
  // back from the source.
  const toTranslate = segments.filter(
    (seg) => !seg.locked && !seg.hiddenBy && !seg.target,
  );

  async function translateMissingTargets() {
    if (toTranslate.length === 0) return;

    const payload = {
      profile_id: profileId,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      texts: toTranslate.map((seg) => seg.source),
      tm_ids: tmIds,
      glossary_ids: glossaryIds,
      workspace: workspaceId,
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
    toTranslate.forEach((seg, index) => {
      const result = results[index];
      if (!result) return;

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
      // invents one is still stored (the reviewer can fix the text), but it is
      // flagged, and the export will not write it until the tags match.
      seg.tagMismatch = Boolean(seg.target) && !inlineTagsMatch(seg.source, seg.target);
      seg.tmInfo = result.tm_info ?? null;
      seg.glossaryInfo = result.glossary_info ?? null;
      seg.machineTranslated = true;
      seg.tmExactMatch = Boolean(exactTm);
      seg.levenshteinDistance = bestScore;
    });
  }

  await translateMissingTargets();

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
    levenshteinDistance: seg.levenshteinDistance ?? null,
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
