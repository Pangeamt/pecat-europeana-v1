import { codeSource, codeTarget, visibleText } from "./codes.js";
import { directChild, elementChildren, findAll, parseXmlTree } from "./xmltree.js";

export const XLIFF_NS = "urn:oasis:names:tc:xliff:document:1.2";
export const SDL_NS = "http://sdl.com/FileTypes/SdlXliff/1.0";

const TRUTHY = new Set(["true", "yes", "1", "y"]);

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
  if (xp === null) throw new Error("not an XLIFF 1.2 document");
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
  for (const node of findAll(root, (n) => n.name === names.unit)) {
    const id = node.attrs.get("id") ?? "";
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
  }

  const file = findAll(root, (n) => n.name === names.file)[0] ?? null;
  return {
    tree,
    root,
    names,
    units,
    unitById,
    sourceLanguage: file?.attrs.get("source-language") ?? null,
    targetLanguage: file?.attrs.get("target-language") ?? null,
  };
}

function segDef(unit, mid) {
  const seg = mid != null ? unit.sdlSegs.get(mid) : undefined;
  if (!seg) return { locked: false, origin: null, conf: null, percent: null };
  const percent = seg.attrs.get("percent");
  return {
    locked: TRUTHY.has(String(seg.attrs.get("locked") ?? "").toLowerCase()),
    origin: seg.attrs.get("origin") ?? null,
    conf: seg.attrs.get("conf") ?? null,
    percent: percent !== undefined && percent !== "" ? Number(percent) : null,
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
  const segments = [];
  for (const unit of index.units) {
    // Structural units (translate="no", own or inherited: lockTU definitions,
    // slide metadata...) are not editable. They survive export untouched.
    if (!unit.translatable) continue;

    const parts = [];
    if (unit.sourceMrks.size) {
      for (const [mid, mrk] of unit.sourceMrks) {
        const { coded, byId } = codeSource(mrk);
        const targetMrk = unit.targetMrks.get(mid);
        parts.push({ mid, coded, target: targetMrk ? codeTarget(targetMrk, byId) : null });
      }
    } else if (unit.source) {
      const { coded, byId } = codeSource(unit.source);
      parts.push({ mid: null, coded, target: unit.target ? codeTarget(unit.target, byId) : null });
    }

    let segmentIndex = 0;
    for (const part of parts) {
      // Nothing a human can translate (empty or tags only): not an editable
      // segment, same as before. Its target stays as the client left it.
      if (!visibleText(part.coded).trim()) continue;
      const target = part.target?.trim() ? part.target.trim() : null;
      segments.push({
        transUnitId: unit.id,
        mid: part.mid,
        segmentIndex: segmentIndex++,
        isSegmented: part.mid !== null,
        source: part.coded.trim(),
        target,
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
