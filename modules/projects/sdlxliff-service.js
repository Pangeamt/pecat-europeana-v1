import xml2js from 'xml2js';
import axios from 'axios';
import { HttpError } from '../shared/http-error';

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

// Flatten all <trans-unit> elements (in document order) from an ordered parse.
function getOrderedTransUnits(orderedXml) {
  const file = orderedXml?.xliff?.file?.[0];
  const body = file?.body?.[0];
  const groups = body?.group || [];
  const list = [];
  for (const group of groups) {
    const transUnits = group['trans-unit'] || [];
    for (const tu of transUnits) list.push(tu);
  }
  return { file, list };
}

// Flatten all <trans-unit> elements (in document order) from a simple parse.
function getSimpleTransUnits(simpleXml) {
  const body = simpleXml?.xliff?.file?.body;
  if (!body) return [];
  const groups = Array.isArray(body.group) ? body.group : body.group ? [body.group] : [];
  const list = [];
  for (const group of groups) {
    const transUnits = Array.isArray(group['trans-unit'])
      ? group['trans-unit']
      : group['trans-unit']
        ? [group['trans-unit']]
        : [];
    for (const tu of transUnits) list.push(tu);
  }
  return list;
}

// Compute the source segments for a single ordered <trans-unit>.
// Preference: <seg-source> (respects original segmentation). Fallback: <source>.
function getTransUnitSegments(orderedTransUnit) {
  const segSource = orderedTransUnit['seg-source']?.[0];

  if (segSource) {
    const g = segSource.g?.[0];
    const mrks = g?.mrk || [];
    const segments = [];
    for (const mrk of mrks) {
      if (mrk.$ && mrk.$['mtype'] === 'seg') {
        const text = normalizeSegmentText(collectText(mrk));
        if (text) {
          segments.push({ mid: mrk.$['mid'], text });
        }
      }
    }
    if (segments.length > 0) {
      return { segmented: true, segments, gAttrs: g?.$ };
    }
    // <seg-source> present but not sentence-segmented (no <mrk mtype="seg">):
    // a pre-segmentation Trados file keeps text directly in <g> or as <x/>
    // placeholders. Fall back to the whole seg-source text as one segment.
    const whole = normalizeSegmentText(collectText(segSource));
    if (whole) {
      return { segmented: false, segments: [{ mid: null, text: whole }], gAttrs: g?.$ };
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
  const sources = [];

  for (const tu of list) {
    const id = tu.$?.id;
    const info = getTransUnitSegments(tu);
    info.segments.forEach((seg, idx) => {
      sources.push({
        id,
        source: seg.text,
        segmentIndex: idx,
        isSegmented: info.segmented,
      });
    });
  }

  if (sources.length === 0) {
    throw new HttpError(400, 'No translation units found in SDLXLIFF file.');
  }

  return {
    sourceLanguage: sourceLanguage.split('-')[0].toLowerCase(),
    targetLanguage: targetLanguage ? targetLanguage.split('-')[0].toLowerCase() : null,
    sources,
  };
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
