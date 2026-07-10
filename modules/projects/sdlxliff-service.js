import xml2js from 'xml2js';
import axios from 'axios';
import { HttpError } from '../shared/http-error';
import { postMTQE } from '../../lib/utils';

const NEXRELAY_API_HOST = process.env.NEXRELAY_API_HOST || 'http://prod.pangeamt.com:8080';
const NEXRELAY_API_KEY = process.env.NEXRELAY_API_KEY || 'pcat-7d9a3f8e2b4c1d6f-default';
// Translating a whole document (many segments + TM/glossary lookups) can take a
// while; 30s was too short. Configurable via NEXRELAY_TIMEOUT (ms).
const NEXRELAY_TIMEOUT = Number(process.env.NEXRELAY_TIMEOUT) || 120000;

// Parser used ONLY to read text in document order. xml2js' default config merges
// all character data of a node into `_` and exposes children separately, which
// loses the position of inline tags (e.g. "efecto <g>waterbed</g>, ya es..."
// would drop "waterbed" to the end). With preserveChildrenOrder + charsAsChildren
// the ordered children live in `$$`, so we can rebuild the exact text.
function createOrderedParser() {
  return new xml2js.Parser({
    explicitArray: true,
    explicitChildren: true,
    preserveChildrenOrder: true,
    charsAsChildren: true,
    includeWhiteChars: true,
    trim: false,
  });
}

// Parser used to mutate + rebuild the file on export. Builder round-trips this
// shape reliably (unlike the `$$` shape produced by the ordered parser).
function createSimpleParser() {
  return new xml2js.Parser({ explicitArray: false });
}

// Collapse any run of whitespace (newlines/tabs/indentation) into a single space
// and trim the ends. SDLXLIFF segment whitespace is not semantic, so this makes a
// pretty-printed file behave exactly like a minified one and keeps the text we
// send to translation (and store as srcLiteral) clean. Applied identically on
// import and export, so source<->TU matching stays consistent.
function normalizeSegmentText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/\s+/g, ' ').trim();
}

// Walk an ordered-parser node and reconstruct its text, respecting the original
// order of character data and nested <g>/<mrk> inline tags.
function collectText(node) {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string') return node;

  if (Array.isArray(node.$$)) {
    let out = '';
    for (const child of node.$$) {
      if (child['#name'] === '__text__') {
        out += child._ || '';
      } else {
        out += collectText(child);
      }
    }
    return out;
  }

  return node._ || '';
}

// Recursively collect the <trans-unit> elements of a <body>/<group> container:
// Trados places them directly under <body>, inside <group>, or in nested
// groups. `toArray` adapts to the parser shape (ordered: always arrays;
// simple: scalar when there is a single child).
function collectContainerTransUnits(container, toArray, out) {
  for (const tu of toArray(container['trans-unit'])) out.push(tu);
  for (const group of toArray(container.group)) {
    collectContainerTransUnits(group, toArray, out);
  }
}

// Flatten all <trans-unit> elements from an ordered parse. A SDLXLIFF can hold
// SEVERAL <file> elements for the same document (e.g. pptx slides/notes split
// by Trados), so every one of them is traversed. Both flatteners visit
// files/groups in the same order, so their indexes stay aligned for export.
function getOrderedTransUnits(orderedXml) {
  const files = orderedXml?.xliff?.file || [];
  const toArray = (value) => value || [];
  const list = [];
  for (const file of files) {
    const body = file?.body?.[0];
    if (body) collectContainerTransUnits(body, toArray, list);
  }
  return { file: files[0], list };
}

// Flatten all <trans-unit> elements from a simple parse (same traversal order
// as getOrderedTransUnits).
function getSimpleTransUnits(simpleXml) {
  const rawFiles = simpleXml?.xliff?.file;
  const files = Array.isArray(rawFiles) ? rawFiles : rawFiles ? [rawFiles] : [];
  const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);
  const list = [];
  for (const file of files) {
    if (file?.body) collectContainerTransUnits(file.body, toArray, list);
  }
  return list;
}

// Collect every <mrk mtype="seg"> descendant of an ordered-parser node, in
// document order. Trados files place them either directly under <seg-source>/
// <target> or wrapped in one or more <g> tags, so we walk the whole subtree.
function collectSegMrks(node, out = []) {
  if (!node || typeof node === 'string') return out;
  if (Array.isArray(node.$$)) {
    for (const child of node.$$) {
      if (child['#name'] === 'mrk' && child.$?.mtype === 'seg') {
        out.push(child);
      } else if (child['#name'] !== '__text__') {
        collectSegMrks(child, out);
      }
    }
  }
  return out;
}

// Compute the source segments for a single ordered <trans-unit>.
// Preference: <seg-source> (respects original segmentation). Fallback: <source>.
function getTransUnitSegments(orderedTransUnit) {
  const segSource = orderedTransUnit['seg-source']?.[0];

  if (segSource) {
    const mrks = collectSegMrks(segSource);
    const segments = [];
    for (const mrk of mrks) {
      const text = normalizeSegmentText(collectText(mrk));
      if (text) {
        segments.push({ mid: mrk.$?.mid ?? null, text });
      }
    }
    if (segments.length > 0) {
      return { segmented: true, segments, gAttrs: segSource.g?.[0]?.$ };
    }
    // <seg-source> present but not sentence-segmented (no <mrk mtype="seg">):
    // a pre-segmentation Trados file keeps text directly in <g> or as <x/>
    // placeholders. Fall back to the whole seg-source text as one segment.
    const whole = normalizeSegmentText(collectText(segSource));
    if (whole) {
      return { segmented: false, segments: [{ mid: null, text: whole }], gAttrs: segSource.g?.[0]?.$ };
    }
    return { segmented: false, segments: [], gAttrs: null };
  }

  const source = orderedTransUnit.source?.[0];
  if (source) {
    const text = normalizeSegmentText(collectText(source));
    if (text) {
      return { segmented: false, segments: [{ mid: null, text }], gAttrs: source.g?.[0]?.$ };
    }
  }

  return { segmented: false, segments: [], gAttrs: null };
}

// Extract the existing translations of a <trans-unit>: a map mid -> text for
// segmented targets, plus the whole-target text for unsegmented ones.
function getTransUnitTargetTexts(orderedTransUnit) {
  const target = orderedTransUnit.target?.[0];
  if (!target) return { byMid: new Map(), whole: '' };

  const byMid = new Map();
  for (const mrk of collectSegMrks(target)) {
    byMid.set(mrk.$?.mid ?? null, normalizeSegmentText(collectText(mrk)));
  }
  return { byMid, whole: normalizeSegmentText(collectText(target)) };
}

// <mrk mid> encodes special characters OOXML-style ("140_x0020_a") while the
// matching <sdl:seg id> keeps them literal ("140 a"). Decode _xHHHH_ escapes
// so seg-defs lookups work for both shapes.
function decodeMid(mid) {
  if (typeof mid !== 'string') return mid;
  return mid.replace(/_x([0-9A-Fa-f]{4})_/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}

// Extract per-segment state from <sdl:seg-defs>. Each <sdl:seg id="X"> matches
// the <mrk mid="X"> of the same trans-unit and carries locked/origin/conf.
function getTransUnitSegDefs(orderedTransUnit) {
  const segs = orderedTransUnit['sdl:seg-defs']?.[0]?.['sdl:seg'] || [];
  const byId = new Map();
  for (const seg of segs) {
    const attrs = seg.$ || {};
    byId.set(attrs.id, {
      locked: attrs.locked === 'true',
      origin: attrs.origin ?? null,
      conf: attrs.conf ?? null,
      percent: attrs.percent !== undefined ? Number(attrs.percent) : null,
    });
  }
  return byId;
}

export async function parseSdlxliffFile(filePath) {
  const fs = await import('fs');
  const fileContent = fs.readFileSync(filePath, 'utf8');

  let xmlData;
  try {
    xmlData = await createOrderedParser().parseStringPromise(fileContent);
  } catch (error) {
    throw new HttpError(400, 'Invalid SDLXLIFF file format. Please ensure the file is a valid XML document.');
  }

  const file = xmlData?.xliff?.file?.[0];
  if (!file) {
    throw new HttpError(400, 'Invalid SDLXLIFF structure. Missing xliff or file element.');
  }

  const sourceLanguage = file.$ ? file.$['source-language'] : null;
  const targetLanguage = file.$ ? file.$['target-language'] : null;

  // Only source-language is required in the file. target-language is optional:
  // source-only SDLXLIFF (no target language assigned yet in Trados) is valid;
  // the target is then taken from the upload form (`tgt`).
  if (!sourceLanguage) {
    throw new HttpError(400, 'SDLXLIFF file must specify a source-language attribute.');
  }

  const { list } = getOrderedTransUnits(xmlData);
  const segments = [];

  for (const tu of list) {
    // Structural units (translate="no", e.g. slide metadata) have no
    // seg-source/target and must not become editable TUs; they are preserved
    // on export because the export rebuilds from the original file.
    if (tu.$?.translate === 'no') continue;

    const transUnitId = tu.$?.id;
    const info = getTransUnitSegments(tu);
    if (info.segments.length === 0) continue;

    const targets = getTransUnitTargetTexts(tu);
    const segDefs = getTransUnitSegDefs(tu);

    info.segments.forEach((seg, idx) => {
      const def =
        seg.mid != null
          ? segDefs.get(seg.mid) ?? segDefs.get(decodeMid(seg.mid))
          : undefined;
      const target = seg.mid != null
        ? targets.byMid.get(seg.mid) ?? null
        : targets.whole || null;

      segments.push({
        transUnitId,
        mid: seg.mid,
        segmentIndex: idx,
        isSegmented: info.segmented,
        source: seg.text,
        target: target || null,
        locked: def?.locked ?? false,
        origin: def?.origin ?? null,
        conf: def?.conf ?? null,
        percent: def?.percent ?? null,
      });
    });
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

// Enrich parsed SDLXLIFF segments in place with two independent branches that
// run in PARALLEL (locked segments are never touched):
//  - no target  -> machine-translate with NexRelay (step 2)
//  - has target -> score the existing translation with MTQE (step 3)
// A NexRelay failure aborts the import (the project would miss translations);
// an MTQE failure is non-fatal: targets are kept, just without score.
export async function enrichSdlxliffSegments(segments, {
  sourceLanguage,
  targetLanguage,
  tmMode = 'standard',
  tmThreshold = 0.75,
  tmIds = [],
  glossaryIds = [],
} = {}) {
  const toTranslate = segments.filter((seg) => !seg.locked && !seg.target);
  const toScore = segments.filter((seg) => !seg.locked && seg.target);

  async function translateMissingTargets() {
    if (toTranslate.length === 0) return;

    const results = await translateWithNexRelay({
      texts: toTranslate.map((seg) => seg.source),
      sourceLanguage,
      targetLanguage,
      tmMode,
      tmThreshold,
      tmIds,
      glossaryIds,
    });

    // NexRelay returns one entry per input text, in the same order.
    toTranslate.forEach((seg, index) => {
      const result = results[index];
      if (!result) return;

      const tmInfoArray = Array.isArray(result.tm_info) ? result.tm_info : [];
      const bestTm = tmInfoArray.find(
        (tm) => tm.tm_match === true && tm.tm_score === 1,
      );

      seg.target = result.target ?? null;
      seg.mtqeScore = result.mtqe_score ?? null;
      seg.tmInfo = result.tm_info ?? null;
      seg.glossaryInfo = result.glossary_info ?? null;
      seg.machineTranslated = true;
      seg.tmExactMatch = Boolean(bestTm);
      seg.levenshteinDistance = bestTm ? bestTm.tm_score : null;
    });
  }

  async function scoreExistingTargets() {
    if (toScore.length === 0) return;

    // MTQE scores every { source, target } pair in one batch. The response
    // returns the pairs in the same order adding the score; results are
    // matched back by the echoed pair when available, by index otherwise.
    const pairs = toScore.map((seg) => ({
      source: seg.source,
      target: seg.target,
    }));

    let response = null;
    try {
      response = await postMTQE({ pairs, sourceLanguage, targetLanguage });
    } catch (error) {
      console.error(
        '[SDLXLIFF] MTQE scoring failed; keeping targets without score:',
        error.message,
      );
      return;
    }

    const items = Array.isArray(response)
      ? response
      : response?.pairs ?? response?.segments ?? response?.scores ?? [];
    const scoreOf = (item) => item?.mtqe_score ?? item?.score ?? null;

    const scoreByPair = new Map();
    for (const item of items) {
      if (typeof item?.source === 'string' && typeof item?.target === 'string') {
        scoreByPair.set(`${item.source}\u0000${item.target}`, scoreOf(item));
      }
    }

    toScore.forEach((seg, index) => {
      const echoed = scoreByPair.get(`${seg.source}\u0000${seg.target}`);
      seg.mtqeScore = echoed ?? scoreOf(items[index]);
    });
  }

  await Promise.all([translateMissingTargets(), scoreExistingTargets()]);

  return { translated: toTranslate.length, scored: toScore.length };
}

// Build Prisma `Tu` rows straight from the parsed (and optionally enriched)
// SDLXLIFF segments. externalId keeps the identity needed for a lossless
// export: "<trans-unit id>::<mrk mid>" (or just the trans-unit id when
// unsegmented). Locked segments (<sdl:seg locked="true">) are blocked from
// editing, and so are NexRelay exact TM matches (tm_score === 1).
export function buildTusDataFromSdlxliffSegments(segments, projectId, sourceLanguage, targetLanguage) {
  return segments.map((seg, index) => ({
    externalId: seg.mid != null ? `${seg.transUnitId}::${seg.mid}` : seg.transUnitId,
    count: index,
    srcLiteral: seg.source,
    translatedLiteral: seg.target ?? null,
    // Scores are stored in the 0..1 scale the UI buckets expect. MTQE/NexRelay
    // already return 0..1; the sdl:seg `percent` attribute is 0..100.
    translationScorePercent:
      seg.mtqeScore ?? (seg.percent != null ? seg.percent / 100 : null),
    tmInfo: seg.tmInfo ?? null,
    glossaryInfo: seg.glossaryInfo ?? null,
    levenshteinDistance: seg.levenshteinDistance ?? null,
    block: seg.locked || seg.tmExactMatch === true,
    sourceLanguage: sourceLanguage || '',
    targetLanguage: targetLanguage || '',
    Status: seg.locked || seg.tmExactMatch === true
      ? 'ACCEPTED'
      : seg.machineTranslated || seg.origin === 'mt'
        ? 'TRANSLATED_MT'
        : 'NOT_REVIEWED',
    projectId,
  }));
}

export async function translateWithNexRelay({
  texts,
  sourceLanguage,
  targetLanguage,
  tmMode = 'standard',
  tmThreshold = 0.75,
  tmIds = [],
  glossaryIds = [],
}) {
  if (!texts || texts.length === 0) {
    throw new HttpError(400, 'No texts provided for translation');
  }

  const payload = {
    source_language: sourceLanguage,
    target_language: targetLanguage,
    texts,
    tm_mode: tmMode,
    tm_threshold: tmThreshold,
    tm_ids: tmIds,
    glossary_ids: glossaryIds,
  };

  try {
    const response = await axios.post(
      `${NEXRELAY_API_HOST}/NexRelay/v1/translate-pecat-e`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          apikey: NEXRELAY_API_KEY,
        },
        timeout: NEXRELAY_TIMEOUT,
      }
    );

    if (!response.data || !response.data.segments) {
      throw new Error('Invalid response format from NexRelay API');
    }

    return response.data.segments;
  } catch (error) {
    console.error('NexRelay translation error:', error.message);
    if (error.response?.status === 401) {
      throw new HttpError(401, 'Invalid API key for translation service');
    }
    if (error.response?.status === 400) {
      throw new HttpError(400, `Translation service error: ${error.response.data?.message || 'Invalid request'}`);
    }
    throw new HttpError(
      500,
      `Translation service unavailable: ${error.message}`
    );
  }
}

export function normalizeNexRelaySegmentsToTusData(segments, projectId, sourceLanguage, targetLanguage) {
  return segments.map((segment, index) => {
    const tmInfoArray = Array.isArray(segment.tm_info) ? segment.tm_info : [];
    const bestTm = tmInfoArray.find((tm) => tm.tm_match === true && tm.tm_score === 1);

    return {
      externalId: null,
      count: index,
      srcLiteral: segment.source || '',
      translatedLiteral: segment.target || null,
      translationScorePercent: segment.mtqe_score ?? null,
      tmInfo: segment.tm_info ?? null,
      glossaryInfo: segment.glossary_info ?? null,
      block: bestTm ? true : false,
      sourceLanguage: sourceLanguage || '',
      targetLanguage: targetLanguage || '',
      Status: bestTm ? 'ACCEPTED' : 'NOT_REVIEWED',
      levenshteinDistance: bestTm ? bestTm.tm_score : null,
      projectId,
    };
  });
}

export async function generateSdlxliffWithTranslations(originalFilePath, tus) {
  const fs = await import('fs');
  const fileContent = fs.readFileSync(originalFilePath, 'utf8');

  let orderedXml;
  let simpleXml;
  try {
    [orderedXml, simpleXml] = await Promise.all([
      createOrderedParser().parseStringPromise(fileContent),
      createSimpleParser().parseStringPromise(fileContent),
    ]);
  } catch (error) {
    throw new HttpError(400, 'Could not parse original SDLXLIFF file for export');
  }

  if (!simpleXml?.xliff?.file) {
    throw new HttpError(400, 'Invalid SDLXLIFF structure in original file');
  }

  // Map translations by trimmed source text. The keys match the source text we
  // sent to NexRelay (and stored as srcLiteral), since both are produced by the
  // same order-preserving extraction.
  const tusMap = new Map();
  tus.forEach((tu) => {
    if (typeof tu.srcLiteral === 'string') {
      tusMap.set(tu.srcLiteral.trim(), tu);
    }
  });

  // Both lists are traversed in identical document order, so index i refers to
  // the same trans-unit in each tree.
  const orderedList = getOrderedTransUnits(orderedXml).list;
  const simpleList = getSimpleTransUnits(simpleXml);

  const count = Math.min(orderedList.length, simpleList.length);
  for (let i = 0; i < count; i++) {
    const info = getTransUnitSegments(orderedList[i]);
    const simpleTransUnit = simpleList[i];
    if (info.segments.length === 0) continue;

    if (info.segmented) {
      const mrkNodes = info.segments.map((seg) => ({
        $: { mtype: 'seg', mid: seg.mid },
        _: tusMap.get(seg.text)?.translatedLiteral || seg.text,
      }));

      simpleTransUnit.target = {
        g: {
          $: info.gAttrs || simpleTransUnit['seg-source']?.g?.$ || {},
          mrk: mrkNodes,
        },
      };
    } else {
      const matchingTu = tusMap.get(info.segments[0].text);
      if (matchingTu && matchingTu.translatedLiteral) {
        simpleTransUnit.target = matchingTu.translatedLiteral;
      }
    }
  }

  const builder = new xml2js.Builder();
  return builder.buildObject(simpleXml);
}

export async function exportSdlxliffForDownload(originalFilePath, tus) {
  try {
    return await generateSdlxliffWithTranslations(originalFilePath, tus);
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(500, `Error generating SDLXLIFF export: ${error.message}`);
  }
}
