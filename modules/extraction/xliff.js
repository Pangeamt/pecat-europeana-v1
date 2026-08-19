import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { readFile, rename, writeFile } from "fs/promises";
import { HttpError } from "@/modules/shared";

export const XLIFF_12_NS = "urn:oasis:names:tc:xliff:document:1.2";

// Inline XLIFF codes are exposed as letter-coded placeholders:
//   <g id="1">x</g> -> <g1>x</g1>     <x id="2"/> | <ph/> | <it/> -> <x2/>
//   <bpt id="1">    -> <b1/>          <ept id="1"> -> <e1/>
// Originals are stored keyed by the CODED TAG (g1, b1, e1...), never by raw id:
// Tikal emits bpt/ept pairs sharing the same id, so keying by id alone would
// make the closing code overwrite the opening one and corrupt the merge.
const CODE_LETTER = {
  g: "g",
  x: "x",
  ph: "x",
  it: "x",
  bpt: "b",
  ept: "e",
};

export const TOKEN_RE = /<(\/?)([gxbe])(\d+)(\/?)>/g;

// Sentence-segmented trans-units (tikal -seg) expose one segment per
// <mrk mtype="seg"> with id "<trans-unit id>::<mid>".
const SEGMENT_ID_SEPARATOR = "::";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const CDATA_NODE = 4;

/**
 * Lists every editable sentence segment: {id, source, target, translatable}.
 * Sources carry the coded inline placeholders.
 */
export async function listXliffSegments(xlfPath) {
  const doc = await load(xlfPath);
  const segments = [];
  for (const tu of transUnits(doc)) {
    const targetEl = directChild(tu.element, "target");
    const targetByMid = targetSegmentsByMid(targetEl);
    for (const segment of editableSegments(tu)) {
      let target = null;
      if (segment.mid === null) {
        target =
          targetEl && hasContent(targetEl) ? toCoded(targetEl, new Map()) : null;
      } else {
        const mrk = targetByMid.get(segment.mid);
        target = mrk && hasContent(mrk) ? toCoded(mrk, new Map()) : null;
      }
      segments.push({
        id: segment.key,
        source: segment.coded,
        target,
        translatable: tu.translatable,
        state: targetEl?.getAttribute("state") || null,
      });
    }
  }
  return segments;
}

/**
 * Applies target updates all-or-nothing: every update is validated against
 * its segment's inline codes before anything is written to disk.
 */
export async function updateXliffTargets(xlfPath, updates) {
  const doc = await load(xlfPath);
  const byKey = new Map();
  for (const tu of transUnits(doc)) {
    for (const segment of editableSegments(tu)) {
      byKey.set(segment.key, { tu, segment });
    }
  }

  const errors = [];
  const seen = new Set();
  const pendingByUnit = new Map();
  let updated = 0;
  for (const update of updates) {
    if (seen.has(update.id)) {
      errors.push(`segment "${update.id}" appears more than once in the request`);
      continue;
    }
    seen.add(update.id);
    const entry = byKey.get(update.id);
    if (!entry) {
      errors.push(`segment "${update.id}" does not exist`);
      continue;
    }
    if (!entry.tu.translatable) {
      errors.push(`segment "${update.id}" is locked (translate="no")`);
      continue;
    }
    try {
      const nodes = buildInlineNodes(doc, entry.segment, update.target);
      let unitUpdates = pendingByUnit.get(entry.tu);
      if (!unitUpdates) {
        unitUpdates = new Map();
        pendingByUnit.set(entry.tu, unitUpdates);
      }
      unitUpdates.set(entry.segment.mid ?? "", nodes);
      updated++;
    } catch (error) {
      errors.push(`segment "${update.id}": ${error?.message ?? error}`);
    }
  }
  if (errors.length) {
    throw new HttpError(
      400,
      `Invalid target updates: ${errors.join("; ")}`,
      "INVALID_TARGETS",
    );
  }

  for (const [tu, unitUpdates] of pendingByUnit) {
    replaceTarget(tu, buildUnitTarget(doc, tu, unitUpdates));
  }
  await save(doc, xlfPath);
  return { updated };
}

/**
 * Tikal refuses to merge trans-units without <target>; copy the source into
 * any missing/empty target (per sentence segment when segmented) so the
 * document always reconstructs completely.
 */
export async function prepareXliffForMerge(xlfPath) {
  const doc = await load(xlfPath);
  let filled = 0;
  for (const tu of transUnits(doc)) {
    const existing = directChild(tu.element, "target");
    if (tu.segSourceEl) {
      // Segmented: every <mrk> must end up with content or the merge drops
      // that sentence. Rebuild only when some segment is missing/empty.
      const targetByMid = targetSegmentsByMid(existing);
      const incomplete = tu.segments.some((segment) => {
        const mrk = targetByMid.get(segment.mid);
        return !mrk || !hasContent(mrk);
      });
      if (!incomplete) continue;
      replaceTarget(tu, buildUnitTarget(doc, tu, new Map(), { fillFromSource: true }));
      filled++;
      continue;
    }
    if (existing && hasContent(existing)) continue;
    const target = doc.createElementNS(XLIFF_12_NS, "target");
    for (let i = 0; i < tu.sourceEl.childNodes.length; i++) {
      target.appendChild(tu.sourceEl.childNodes[i].cloneNode(true));
    }
    replaceTarget(tu, target);
    filled++;
  }
  if (filled) await save(doc, xlfPath);
  return { filled };
}

async function load(xlfPath) {
  let xml;
  try {
    xml = await readFile(xlfPath, "utf8");
  } catch {
    throw new HttpError(422, `XLIFF file not found: ${xlfPath}`, "XLIFF_MISSING");
  }
  return parse(xml);
}

function parse(xml) {
  let doc;
  try {
    doc = new DOMParser().parseFromString(xml, "text/xml");
  } catch (error) {
    throw new HttpError(
      422,
      `XLIFF is not well-formed: ${error?.message}`,
      "XLIFF_INVALID",
    );
  }
  const root = doc.documentElement;
  if (!root || root.localName !== "xliff") {
    throw new HttpError(422, "File is not an XLIFF document", "XLIFF_INVALID");
  }
  // Require the 1.2 namespace: a doc claiming version="1.2" without it would
  // silently yield zero segments from the namespaced queries below.
  if (root.namespaceURI !== XLIFF_12_NS) {
    throw new HttpError(
      422,
      `Unsupported XLIFF version "${root.getAttribute("version") ?? "unknown"}" — only 1.2 (Tikal output) is supported`,
      "XLIFF_INVALID",
    );
  }
  return doc;
}

/**
 * Segments worth exposing: those with an empty source (blank paragraphs,
 * common in PDF conversions) have nothing to translate. They stay in the .xlf
 * untouched — prepareXliffForMerge still fills ALL of them so Tikal gets its
 * targets — but they are neither listed nor updatable.
 */
function editableSegments(tu) {
  return tu.segments.filter((segment) => hasContent(segment.container));
}

function transUnits(doc) {
  const units = [];
  const nodes = doc.getElementsByTagNameNS(XLIFF_12_NS, "trans-unit");
  for (let i = 0; i < nodes.length; i++) {
    const element = nodes[i];
    const sourceEl = directChild(element, "source");
    if (!sourceEl) continue;
    const id = element.getAttribute("id") ?? String(i);
    const segSourceEl = directChild(element, "seg-source");
    const mrks = segSourceEl ? segMrks(segSourceEl) : [];

    const segments = [];
    if (mrks.length) {
      for (const mrk of mrks) {
        const mid = mrk.getAttribute("mid") ?? String(segments.length);
        const codes = new Map();
        segments.push({
          key: `${id}${SEGMENT_ID_SEPARATOR}${mid}`,
          mid,
          container: mrk,
          codes,
          coded: toCoded(mrk, codes),
        });
      }
    } else {
      const codes = new Map();
      segments.push({
        key: id,
        mid: null,
        container: sourceEl,
        codes,
        coded: toCoded(sourceEl, codes),
      });
    }

    units.push({
      element,
      id,
      translatable: element.getAttribute("translate") !== "no",
      sourceEl,
      segSourceEl: mrks.length ? segSourceEl : null,
      segments,
    });
  }
  return units;
}

/** Direct <mrk mtype="seg"> children (sentence segments) of a container. */
function segMrks(container) {
  const mrks = [];
  for (let i = 0; i < container.childNodes.length; i++) {
    const child = container.childNodes[i];
    if (
      child.nodeType === ELEMENT_NODE &&
      child.localName === "mrk" &&
      child.getAttribute("mtype") === "seg"
    ) {
      mrks.push(child);
    }
  }
  return mrks;
}

function targetSegmentsByMid(targetEl) {
  const byMid = new Map();
  if (!targetEl) return byMid;
  for (const mrk of segMrks(targetEl)) {
    const mid = mrk.getAttribute("mid");
    if (mid !== null) byMid.set(mid, mrk);
  }
  return byMid;
}

function directChild(element, localName) {
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    if (child.nodeType === ELEMENT_NODE && child.localName === localName) {
      return child;
    }
  }
  return null;
}

function toCoded(container, codes) {
  let out = "";
  for (let i = 0; i < container.childNodes.length; i++) {
    const node = container.childNodes[i];
    if (node.nodeType === TEXT_NODE || node.nodeType === CDATA_NODE) {
      out += node.data;
      continue;
    }
    if (node.nodeType !== ELEMENT_NODE) continue;
    const letter = CODE_LETTER[node.localName];
    if (!letter) {
      out += toCoded(node, codes);
      continue;
    }
    const key = uniqueKey(codes, letter, node.getAttribute("id"));
    codes.set(key, node);
    out += letter === "g" ? `<${key}>${toCoded(node, codes)}</${key}>` : `<${key}/>`;
  }
  return out;
}

function uniqueKey(codes, letter, id) {
  const numeric = id && /^\d+$/.test(id) ? id : null;
  if (numeric && !codes.has(letter + numeric)) return letter + numeric;
  let n = numeric ? parseInt(numeric, 10) : 1;
  while (codes.has(letter + n)) n++;
  return letter + n;
}

/**
 * Builds the DOM nodes for one segment from coded text, re-inserting deep
 * copies of the original inline elements so Tikal can re-anchor the native
 * codes on merge. Throws on unknown/missing/duplicated codes.
 */
function buildInlineNodes(doc, segment, coded) {
  const root = doc.createElementNS(XLIFF_12_NS, "target"); // scratch container
  const stack = [{ el: root, key: null }];
  const used = new Map();
  let lastIndex = 0;

  for (const match of coded.matchAll(TOKEN_RE)) {
    const [full, closing, letter, num, selfClosing] = match;
    const key = letter + num;
    appendText(doc, stack[stack.length - 1].el, coded.slice(lastIndex, match.index));
    lastIndex = (match.index ?? 0) + full.length;

    const original = segment.codes.get(key);
    if (!original) {
      throw new Error(
        `unknown inline code <${key}> — source codes: ${[...segment.codes.keys()].join(", ") || "none"}`,
      );
    }
    if (letter === "g") {
      if (closing) {
        const top = stack.pop();
        if (!top?.key || top.key !== key) {
          throw new Error(`mismatched closing tag </${key}>`);
        }
      } else if (selfClosing) {
        used.set(key, (used.get(key) ?? 0) + 1);
        stack[stack.length - 1].el.appendChild(original.cloneNode(false));
      } else {
        used.set(key, (used.get(key) ?? 0) + 1);
        // Shallow clone keeps id/attrs; the translated content goes inside.
        const clone = original.cloneNode(false);
        stack[stack.length - 1].el.appendChild(clone);
        stack.push({ el: clone, key });
      }
    } else {
      if (closing) throw new Error(`<${key}> is a standalone code, </${key}> is invalid`);
      used.set(key, (used.get(key) ?? 0) + 1);
      // Deep clone: bpt/ept/ph content is native code, not translatable text.
      stack[stack.length - 1].el.appendChild(original.cloneNode(true));
    }
  }
  if (stack.length !== 1) {
    throw new Error(`unclosed tag <${stack[stack.length - 1].key}>`);
  }
  appendText(doc, root, coded.slice(lastIndex));

  // Multiset check: every source code must appear exactly once, or the merged
  // document silently drops (or duplicates) native formatting codes.
  const missing = [...segment.codes.keys()].filter((k) => !used.has(k));
  const duplicated = [...used.entries()].filter(([, n]) => n > 1).map(([k]) => k);
  if (missing.length || duplicated.length) {
    const parts = [];
    if (missing.length) {
      parts.push(`missing inline codes: ${missing.map((k) => `<${k}>`).join(", ")}`);
    }
    if (duplicated.length) {
      parts.push(`duplicated inline codes: ${duplicated.map((k) => `<${k}>`).join(", ")}`);
    }
    throw new Error(parts.join("; "));
  }

  const nodes = [];
  while (root.firstChild) {
    const node = root.firstChild;
    root.removeChild(node);
    nodes.push(node);
  }
  return nodes;
}

/**
 * Builds the whole <target> for a trans-unit. `unitUpdates` maps the mrk mid
 * ('' for unsegmented units) to the validated replacement nodes. Segments
 * without an update keep their existing translation; otherwise they stay as
 * an EMPTY <mrk> (still reported as untranslated) unless `fillFromSource` is
 * set — the pre-merge pass — which copies the source sentence so Tikal always
 * merges a complete document.
 */
function buildUnitTarget(doc, tu, unitUpdates, { fillFromSource = false } = {}) {
  const target = doc.createElementNS(XLIFF_12_NS, "target");
  if (unitUpdates.size) target.setAttribute("state", "translated");

  if (!tu.segSourceEl) {
    const nodes = unitUpdates.get("") ?? [];
    for (const node of nodes) target.appendChild(node);
    return target;
  }

  // Mirror the seg-source structure (inter-segment text included) so the
  // merged document preserves spacing between sentences.
  const existingByMid = targetSegmentsByMid(directChild(tu.element, "target"));
  for (let i = 0; i < tu.segSourceEl.childNodes.length; i++) {
    const child = tu.segSourceEl.childNodes[i];
    const isSegMrk =
      child.nodeType === ELEMENT_NODE &&
      child.localName === "mrk" &&
      child.getAttribute("mtype") === "seg";
    if (!isSegMrk) {
      target.appendChild(child.cloneNode(true));
      continue;
    }
    const mid = child.getAttribute("mid") ?? "";
    const updateNodes = unitUpdates.get(mid);
    if (updateNodes) {
      const clone = child.cloneNode(false);
      for (const node of updateNodes) clone.appendChild(node);
      target.appendChild(clone);
      continue;
    }
    const existing = existingByMid.get(mid);
    if (existing && hasContent(existing)) {
      target.appendChild(existing.cloneNode(true));
      continue;
    }
    // Untranslated sentence: empty <mrk> while editing, source copy on merge.
    target.appendChild(child.cloneNode(fillFromSource));
  }
  return target;
}

function appendText(doc, el, text) {
  if (text) el.appendChild(doc.createTextNode(text));
}

function replaceTarget(tu, target) {
  const existing = directChild(tu.element, "target");
  if (existing) {
    tu.element.replaceChild(target, existing);
  } else {
    const anchor = tu.segSourceEl ?? tu.sourceEl;
    tu.element.insertBefore(target, anchor.nextSibling);
  }
}

function hasContent(el) {
  for (let i = 0; i < el.childNodes.length; i++) {
    const node = el.childNodes[i];
    if (node.nodeType === ELEMENT_NODE) return true;
    if ((node.nodeType === TEXT_NODE || node.nodeType === CDATA_NODE) && node.data.trim()) {
      return true;
    }
  }
  return false;
}

// Atomic save (tmp + rename) so a concurrent reader — including a Tikal
// merge — never observes a truncated file.
async function save(doc, xlfPath) {
  let xml = new XMLSerializer().serializeToString(doc);
  if (!xml.startsWith("<?xml")) {
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml;
  }
  const tmp = `${xlfPath}.tmp`;
  await writeFile(tmp, xml, "utf8");
  await rename(tmp, xlfPath);
}
