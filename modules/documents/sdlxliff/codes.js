import { localName } from "./xmltree.js";

// Inline codes of a SDLXLIFF segment as the SAME letter-coded placeholders the
// Okapi path uses (modules/extraction/xliff.js), so the editor (TagEditor,
// inline-tags.jsx) and every tag check work unchanged:
//   <g id="1">x</g> -> <g1>x</g1>      <x id="2"/> | <ph> | <it> -> <x2/>
//   <bpt>/<bx> -> <bN/>                <ept>/<ex> -> <eN/>
// Unlike Okapi's toCoded, NOTHING is flattened: any other element inside a
// segment (a non-seg <mrk> such as x-sdl-location, <sub>...) becomes an opaque
// <xN/> and is written back verbatim. Flattening it would lose it on export.
const CODE_LETTER = {
  g: "g",
  x: "x",
  ph: "x",
  it: "x",
  bpt: "b",
  bx: "b",
  ept: "e",
  ex: "e",
};

export const TOKEN_RE = /<(\/?)([gxbe])(\d+)(\/?)>/g;

/** Same numbering rule as xliff.js `uniqueKey`: reuse a numeric id, else next free. */
function uniqueKey(codes, letter, id) {
  const numeric = id && /^\d+$/.test(id) ? id : null;
  if (numeric && !codes.has(letter + numeric)) return letter + numeric;
  let n = numeric ? parseInt(numeric, 10) : 1;
  while (codes.has(letter + n)) n++;
  return letter + n;
}

function letterOf(node) {
  return CODE_LETTER[localName(node)] ?? "x";
}

/**
 * Coded text of a segment container (a seg <mrk>). `codes` gets key -> node
 * (the node carries its offsets, so the writer can copy the ORIGINAL bytes).
 * `byId` (optional) makes a second container reuse the first one's keys for
 * the same (letter, id): the target of a segment is coded with its source's
 * keys, so "<x1/>" means the same inline code on both sides.
 */
export function toCoded(container, codes, byId = null, ownIds = null) {
  let out = "";
  for (const node of container.children) {
    if (node.type === "text") {
      out += node.value;
      continue;
    }
    const letter = letterOf(node);
    const id = node.attrs.get("id") ?? null;
    let key = byId && id !== null ? byId.get(letter + ":" + id) : undefined;
    if (!key || codes.has(key)) key = uniqueKey(codes, letter, id);
    codes.set(key, node);
    if (ownIds && id !== null) ownIds.set(letter + ":" + id, key);
    if (letter === "g" && localName(node) === "g") {
      out += node.selfClosing ? `<${key}></${key}>` : `<${key}>${toCoded(node, codes, byId, ownIds)}</${key}>`;
    } else {
      out += `<${key}/>`;
    }
  }
  return out;
}

/** Codes a source segment: returns { coded, codes, byId }. */
export function codeSource(mrk) {
  const codes = new Map();
  const byId = new Map();
  const coded = toCoded(mrk, codes, null, byId);
  return { coded, codes, byId };
}

/** Codes a target segment with the keys of its source (`byId`). */
export function codeTarget(mrk, byId) {
  return toCoded(mrk, new Map(), byId);
}

/** Ordered list of the placeholder tokens: ["<g1>", "</g1>", "<x2/>"]. */
export function tagSequence(text) {
  return String(text ?? "").match(new RegExp(TOKEN_RE.source, "g")) ?? [];
}

/** Coded text without its placeholders (what a human reads). */
export function visibleText(text) {
  return String(text ?? "").replace(new RegExp(TOKEN_RE.source, "g"), "");
}
