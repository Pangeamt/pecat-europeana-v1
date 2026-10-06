import { codeSource, codeTarget, visibleText } from "./codes.js";
import { buildTagInfo, parseTagDefs } from "./tagdefs.js";
import { directChild, elementChildren, findAll, localName, parseXmlTree, textContent } from "./xmltree.js";

export const XLIFF_NS = "urn:oasis:names:tc:xliff:document:1.2";
export const XLIFF2_NS = "urn:oasis:names:tc:xliff:document:2.0";
export const SDL_NS = "http://sdl.com/FileTypes/SdlXliff/1.0";

const TRUTHY = new Set(["true", "yes", "1", "y"]);

// Plain XLIFF 1.2 (.xlf/.xliff, no <sdl:seg>): the same two ideas, said with the
// standard attributes. A unit the client signed off (approved="yes", or a
// target with state signed-off/final) is theirs and locked, like sdl:seg
// locked="true". A target whose state says it was never translated (new,
// needs-translation...) is a placeholder (often a copy of the source), not a
// translation: it counts as empty and is overwritten.
const LOCKED_STATES = new Set(["signed-off", "final"]);
const UNTRANSLATED_STATES = new Set(["new", "needs-translation", "needs-l10n", "needs-adaptation"]);

// XLIFF 2.x says it on <segment state="">: initial | translated | reviewed | final.
// reviewed/final are the client's (the 2.x counterpart of signed-off/final);
// an explicit "initial" with a target is a placeholder. No state at all, with a
// target, is a plain translation (most 2.x files, e.g. simple_20.xlf).
const LOCKED_STATES_V2 = new Set(["reviewed", "final"]);
const UNTRANSLATED_STATES_V2 = new Set(["initial"]);

/** The state of a plain unit (1.2: its <target>; 2.x: its <segment>), or null. */
export function plainState(unit) {
  return unit.v2 ? (unit.node.attrs.get("state") ?? null) : (unit.target?.attrs.get("state") ?? null);
}

/** Whether a plain (no sdl:seg) unit is the client's, locked. */
export function isPlainLocked(unit) {
  if (unit.v2) return LOCKED_STATES_V2.has(plainState(unit));
  return (
    TRUTHY.has(String(unit.node.attrs.get("approved") ?? "").toLowerCase()) ||
    LOCKED_STATES.has(plainState(unit))
  );
}

/** Whether the unit's state says its target is a placeholder, not a translation. */
export function isUntranslatedState(unit) {
  return (unit.v2 ? UNTRANSLATED_STATES_V2 : UNTRANSLATED_STATES).has(plainState(unit));
}

function prefixFor(root, ns) {
  for (const [name, value] of root.attrs) {
    if (value !== ns) continue;
    if (name === "xmlns") return "";
    if (name.startsWith("xmlns:")) return name.slice(6);
  }
  return null;
}

const q = (prefix, local) => (prefix ? `${prefix}:${local}` : local);

function isTranslatable(node) {
  for (let n = node; n && n.type === "el"; n = n.parent) {
    if (n.attrs.get("translate") === "no") return false;
  }
  return true;
}

/**
 * XLIFF 2.x. The unit of work is the <segment> (a <unit> holds one or more,
 * already segmented by the client), with its <source> and <target> as direct
 * children: it is the "plain unit" of 1.2 (no <mrk mtype="seg">), so the same
 * reader/writer code serves it. Differences handled here: ids live on <unit>
 * and <segment> (the latter optional: its position is used), inline codes
 * point to <originalData> of their unit (kept in unit.data for the chip info),
 * and languages are on the root (srcLang/trgLang).
 */
function indexXliff2(tree, root, xp) {
  const names = {
    file: q(xp, "file"),
    unit: q(xp, "unit"),
    segment: q(xp, "segment"),
    source: q(xp, "source"),
    target: q(xp, "target"),
  };
  const fileNodes = findAll(root, (n) => n.name === names.file);
  const multiFile = fileNodes.length > 1;
  const fileIndexOf = (node) => {
    for (let n = node.parent; n && n.type === "el"; n = n.parent) {
      if (n.name === names.file) return fileNodes.indexOf(n);
    }
    return 0;
  };
  const units = [];
  const unitById = new Map();
  const unitByKey = new Map();
  for (const unitNode of findAll(root, (n) => n.name === names.unit)) {
    const unitId = unitNode.attrs.get("id") ?? "";
    const data = new Map();
    for (const d of findAll(unitNode, (n) => localName(n) === "data")) {
      if (d.attrs.has("id")) data.set(d.attrs.get("id"), textContent(d));
    }
    let position = 0;
    for (const segNode of elementChildren(unitNode)) {
      if (segNode.name !== names.segment) continue; // <ignorable>, <notes>... stay as they are
      const id = `${unitId}|${segNode.attrs.get("id") ?? `#${position}`}`;
      position++;
      const key = multiFile ? `${fileIndexOf(unitNode)}:${id}` : id;
      const unit = {
        node: segNode,
        parentUnit: unitNode,
        v2: true,
        data,
        id,
        key,
        translatable: isTranslatable(segNode),
        source: directChild(segNode, names.source),
        segSource: null,
        target: directChild(segNode, names.target),
        segDefs: null,
        sourceMrks: new Map(),
        targetMrks: new Map(),
        sdlSegs: new Map(),
      };
      units.push(unit);
      if (!unitById.has(id)) unitById.set(id, unit);
      if (!unitByKey.has(key)) unitByKey.set(key, unit);
    }
  }
  return {
    tree,
    root,
    names,
    units,
    unitById,
    unitByKey,
    sourceLanguage: root.attrs.get("srcLang") ?? null,
    targetLanguage: root.attrs.get("trgLang") ?? null,
    version: 2,
  };
}

/**
 * Parses the raw file text (BOM included) into the index both the importer
 * and the exporter use. Segments are keyed by (trans-unit id, mrk mid) --
 * never by order or text (matching by source text was the old export's bug:
 * duplicated sources got an arbitrary translation).
 */
export function indexSdlxliff(raw) {
  const tree = parseXmlTree(raw);
  const root = elementChildren(tree)[0];
  if (!root) throw new Error("empty document");
  const xp = prefixFor(root, XLIFF_NS);
  if (xp === null) {
    const xp2 = prefixFor(root, XLIFF2_NS);
    if (xp2 !== null) return indexXliff2(tree, root, xp2);
    throw new Error("not an XLIFF 1.2 or 2.x document");
  }
  const sp = prefixFor(root, SDL_NS) ?? "sdl";
  const names = {
    unit: q(xp, "trans-unit"),
    source: q(xp, "source"),
    segSource: q(xp, "seg-source"),
    target: q(xp, "target"),
    mrk: q(xp, "mrk"),
    file: q(xp, "file"),
    segDefs: q(sp, "seg-defs"),
    seg: q(sp, "seg"),
  };
  const isSegMrk = (n) => n.name === names.mrk && n.attrs.get("mtype") === "seg";

  const units = [];
  const unitById = new Map();
  // XLIFF 1.2 only makes a trans-unit id unique inside its <file>: real client
  // files repeat "0", "1"... across several <file>s (102368_.xliff). With more
  // than one <file> the unit KEY carries the file's position ("2:7"); with one
  // (every Trados file seen so far) it is the bare id, so documents imported
  // before this keep the same externalIds.
  const fileNodes = findAll(root, (n) => n.name === names.file);
  const multiFile = fileNodes.length > 1;
  const unitByKey = new Map();
  const fileIndexOf = (node) => {
    for (let n = node.parent; n && n.type === "el"; n = n.parent) {
      if (n.name === names.file) return fileNodes.indexOf(n);
    }
    return 0;
  };
  for (const node of findAll(root, (n) => n.name === names.unit)) {
    const id = node.attrs.get("id") ?? "";
    const key = multiFile ? `${fileIndexOf(node)}:${id}` : id;
    const source = directChild(node, names.source);
    const segSource = directChild(node, names.segSource);
    const target = directChild(node, names.target);
    const segDefs = directChild(node, names.segDefs);
    const byMid = (container) => {
      const map = new Map();
      if (!container) return map;
      for (const mrk of findAll(container, isSegMrk, { stopAt: isSegMrk })) {
        const mid = mrk.attrs.get("mid");
        if (mid !== undefined && !map.has(mid)) map.set(mid, mrk);
      }
      return map;
    };
    const sdlSegs = new Map();
    if (segDefs) {
      for (const seg of elementChildren(segDefs)) {
        if (seg.name === names.seg && seg.attrs.has("id")) sdlSegs.set(seg.attrs.get("id"), seg);
      }
    }
    const unit = {
      node,
      id,
      key,
      translatable: isTranslatable(node),
      source,
      segSource,
      target,
      segDefs,
      sourceMrks: byMid(segSource),
      targetMrks: byMid(target),
      sdlSegs,
    };
    units.push(unit);
    if (!unitById.has(id)) unitById.set(id, unit);
    if (!unitByKey.has(key)) unitByKey.set(key, unit);
  }

  const file = findAll(root, (n) => n.name === names.file)[0] ?? null;
  return {
    tree,
    root,
    names,
    units,
    unitById,
    unitByKey,
    sourceLanguage: file?.attrs.get("source-language") ?? null,
    targetLanguage: file?.attrs.get("target-language") ?? null,
  };
}

function segDef(unit, mid) {
  const seg = mid != null ? unit.sdlSegs.get(mid) : undefined;
  if (!seg) {
    return {
      locked: isPlainLocked(unit),
      origin: null,
      conf: plainState(unit),
      percent: null,
      textMatch: null,
    };
  }
  const percent = seg.attrs.get("percent");
  return {
    locked: TRUTHY.has(String(seg.attrs.get("locked") ?? "").toLowerCase()),
    origin: seg.attrs.get("origin") ?? null,
    conf: seg.attrs.get("conf") ?? null,
    percent: percent !== undefined && percent !== "" ? Number(percent) : null,
    // "SourceAndTarget" on a 100% TM match = context match (Trados "CM").
    textMatch: seg.attrs.get("text-match") ?? null,
  };
}

/**
 * The segments to import, with inline codes as placeholders (see codes.js).
 * Text inside a segment is kept EXACTLY (no whitespace collapsing: NBSP and
 * narrow NBSP matter in French typography); only the outer whitespace is
 * trimmed -- the exporter puts the seg-source's own edges back.
 */
export function readSdlxliffSegments(raw) {
  const index = indexSdlxliff(raw);
  const tagDefs = parseTagDefs(index.root);
  const segments = [];
  // The number the CAT tool shows for the segment: its position among the
  // segments of the translatable units, INCLUDING the ones not imported below
  // (nothing to translate), so the grid's numbers match the client's.
  let segmentNumber = 0;
  for (const unit of index.units) {
    // Structural units (translate="no", own or inherited: lockTU definitions,
    // slide metadata...) are not editable. They survive export untouched.
    if (!unit.translatable) continue;

    const parts = [];
    if (unit.sourceMrks.size) {
      for (const [mid, mrk] of unit.sourceMrks) {
        const { coded, codes, byId } = codeSource(mrk);
        const targetMrk = unit.targetMrks.get(mid);
        parts.push({
          mid,
          coded,
          tagInfo: buildTagInfo(codes, tagDefs, index.unitById, unit.data),
          target: targetMrk ? codeTarget(targetMrk, byId) : null,
        });
      }
    } else if (unit.source) {
      const { coded, codes, byId } = codeSource(unit.source);
      parts.push({
        mid: null,
        coded,
        tagInfo: buildTagInfo(codes, tagDefs, index.unitById, unit.data),
        target: unit.target ? codeTarget(unit.target, byId) : null,
      });
    }

    let segmentIndex = 0;
    for (const part of parts) {
      segmentNumber += 1;
      // Nothing a human can translate (empty or tags only): not an editable
      // segment, same as before. Its target stays as the client left it.
      if (!visibleText(part.coded).trim()) continue;
      let target = part.target?.trim() ? part.target.trim() : null;
      if (target && part.mid === null && isUntranslatedState(unit)) target = null;
      segments.push({
        transUnitId: unit.key,
        mid: part.mid,
        segmentIndex: segmentIndex++,
        segmentNumber,
        isSegmented: part.mid !== null,
        source: part.coded.trim(),
        target,
        tagInfo: part.tagInfo,
        ...segDef(unit, part.mid),
      });
    }
  }
  return {
    sourceLanguage: index.sourceLanguage,
    targetLanguage: index.targetLanguage,
    segments,
  };
}
