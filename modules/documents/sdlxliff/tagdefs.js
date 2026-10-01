import { inlineTagInfo } from "../../extraction/tag-info.js";
import { elementChildren, findAll, localName, textContent } from "./xmltree.js";

// Tag TYPES for the editor, the way Trados shows them ("glossary", "unit",
// "&deg;"...). Where they come from in a SDLXLIFF: the header carries
//   <tag-defs><tag id="57"><bpt name="glossary">&lt;glossary word="..."&gt;</bpt>
//                           <ept name="glossary">&lt;/glossary&gt;</ept></tag>
//             <tag id="164"><ph name="&amp;amp;" equiv-text="amp">&amp;amp;</ph></tag>
//   </tag-defs>
// keyed by the inline's `id` (the same number the placeholder carries). A
// reference to locked content (<x id="locked3" xid="lockTU_..."/>) points to a
// `lockTU_*` trans-unit whose <source> holds the locked text.
//
// The result is the format-agnostic `tagInfo` stored per segment (Tu.tagInfo):
//   { "<placeholder key>": { name, detail?, close?, equiv?, locked?, lockedText? } }
// Same shape as the Tikal/Okapi XLIFF producer (extraction/xliff.js). Display
// only: nothing here is read by the tag rules or by the writer.

export const MAX_DETAIL = 500;
export const MAX_LOCKED_TEXT = 300;

const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** Every `<tag-defs>` in the file -> Map id -> { name, open?, close?, equiv? }. */
export function parseTagDefs(root) {
  const defs = new Map();
  for (const container of findAll(root, (n) => localName(n) === "tag-defs")) {
    for (const tag of elementChildren(container)) {
      if (localName(tag) !== "tag") continue;
      const id = tag.attrs.get("id");
      if (id === undefined || defs.has(id)) continue;
      const def = {};
      for (const child of elementChildren(tag)) {
        const kind = localName(child);
        if (kind === "bpt" || kind === "ph" || kind === "st" || kind === "bx" || kind === "it") {
          def.name ??= child.attrs.get("name");
          def.open = textContent(child);
          const equiv = child.attrs.get("equiv-text");
          if (equiv) def.equiv ??= equiv;
        } else if (kind === "ept" || kind === "ex" || kind === "et") {
          def.name ??= child.attrs.get("name");
          def.close = textContent(child);
        }
      }
      if (def.name) defs.set(id, def);
    }
  }
  return defs;
}

/** Locked content of a `lockTU_*` unit: its text and the type of its tags. */
function lockedInfo(unit, defs) {
  const source = unit?.source;
  if (!source) return null;
  const names = [];
  for (const g of findAll(source, (n) => localName(n) === "g")) {
    const def = defs.get(g.attrs.get("id"));
    if (def && !names.includes(def.name)) names.push(def.name);
  }
  const text = textContent(source).replace(/\s+/g, " ").trim();
  return {
    name: names[0] ?? "locked",
    locked: true,
    ...(names.length > 1 ? { detail: names.join(" › ") } : {}),
    ...(text ? { lockedText: clip(text, MAX_LOCKED_TEXT) } : {}),
  };
}

/**
 * tagInfo of one segment from its `codes` map (placeholder key -> source node,
 * as returned by codes.js `codeSource`). Built from that SAME map on purpose:
 * references to locked content are renumbered (`uniqueKey`), so "x1" can be a
 * locked reference in one segment and tag-def 1 in another.
 */
/**
 * Chip info of an inline of a plain XLIFF. 1.2: ctype, equiv-text and the code
 * as the element's text. 2.x: type/subType ("fmt", "xlf:b" -> "b"), equiv/disp,
 * and the code in the unit's <originalData> (dataRef; dataRefStart/dataRefEnd
 * for a <pc>, whose closing chip shows the end code).
 */
function plainInlineInfo(node, dataMap) {
  const kind = localName(node);
  const subType = (node.attrs.get("subType") ?? "").split(":").pop();
  const ref = node.attrs.get("dataRef") ?? node.attrs.get("dataRefStart");
  const refEnd = node.attrs.get("dataRefEnd");
  const container = kind === "g" || kind === "pc" || kind === "mrk";
  const info = inlineTagInfo({
    ctype: subType || node.attrs.get("type") || node.attrs.get("ctype") || "",
    equiv: node.attrs.get("equiv") ?? node.attrs.get("disp") ?? node.attrs.get("equiv-text") ?? "",
    code: ref !== undefined ? (dataMap?.get(ref) ?? "") : container ? "" : textContent(node),
  });
  const end = refEnd !== undefined ? dataMap?.get(refEnd) : undefined;
  if (info && end) info.close = clip(end, MAX_DETAIL);
  return info;
}

export function buildTagInfo(codes, defs, unitById, dataMap = null) {
  const info = {};
  for (const [key, node] of codes) {
    const xid = node.attrs.get("xid");
    let entry = null;
    if (xid && unitById.has(xid)) {
      entry = lockedInfo(unitById.get(xid), defs);
    } else {
      const def = defs.get(node.attrs.get("id"));
      if (!def) {
        // Plain XLIFF (no <tag-defs>): what the inline itself says, as Tikal's.
        entry = plainInlineInfo(node, dataMap);
      } else {
        const closing = ["ept", "ex"].includes(localName(node));
        const detail = closing ? (def.close ?? def.open) : def.open;
        entry = {
          name: def.name,
          ...(detail ? { detail: clip(detail, MAX_DETAIL) } : {}),
          ...(def.close && !closing ? { close: clip(def.close, MAX_DETAIL) } : {}),
          ...(def.equiv ? { equiv: def.equiv } : {}),
        };
      }
    }
    if (entry) info[key] = entry;
  }
  return Object.keys(info).length ? info : null;
}
