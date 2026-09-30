// Lightweight, offset-preserving XML tree for SDLXLIFF.
//
// Why not a DOM: the export must change ONLY our target <mrk>s and their
// <sdl:seg> attributes and leave every other byte of the client's file as it
// was. Any serializer (xmldom, xml2js...) rewrites things on the way out
// (BOM, CRLF, &quot;, <e></e> -> <e/>); xml2js even reorders mixed content.
// Measured on 2,037 real Trados files: splicing the original text at the
// offsets recorded here is byte-identical outside the edited spans in 100% of
// them. This parser is deliberately small: SDLXLIFF has no DOCTYPE/entities
// beyond the predefined ones (0 CDATA, 0 comments, 0 numeric refs in the
// corpus), but those are still handled so an odd file does not break.
//
// Node shapes:
//   element: { type: "el", name, attrs: Map<name, decodedValue>, start,
//              openEnd, closeStart, end, selfClosing, children, parent }
//     start..openEnd       the start tag text ("<g id="1">")
//     openEnd..closeStart  the content (empty for self-closing elements)
//     closeStart..end      the end tag text ("</g>"); equals openEnd..end
//                          for a self-closing element
//   text:    { type: "text", start, end, raw, value, parent }  (value decoded)

const PREDEFINED = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };

export function decodeEntities(raw) {
  if (!raw.includes("&")) return raw;
  return raw.replace(/&(#x[0-9a-fA-F]+|#\d+|[A-Za-z]+);/g, (whole, ref) => {
    if (ref[0] === "#") {
      const code = ref[1] === "x" || ref[1] === "X"
        ? parseInt(ref.slice(2), 16)
        : parseInt(ref.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return PREDEFINED[ref] ?? whole;
  });
}

function parseAttributes(tagText) {
  // tagText: the start tag WITHOUT "<name" and the closing ">" or "/>".
  const attrs = new Map();
  const re = /([^\s=/>]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = re.exec(tagText))) {
    attrs.set(match[1], decodeEntities(match[3] ?? match[4] ?? ""));
  }
  return attrs;
}

// Index of the ">" that closes the tag opened at `from`, skipping quoted
// attribute values (a ">" inside quotes is legal XML).
function findTagEnd(s, from) {
  let quote = null;
  for (let i = from; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === ">") {
      return i;
    }
  }
  throw new Error(`unterminated tag at offset ${from}`);
}

/** Parses `s` (the raw file text, BOM included) into an offset tree. */
export function parseXmlTree(s) {
  const root = { type: "root", children: [], parent: null, start: 0, end: s.length };
  const stack = [root];
  let i = 0;
  const pushText = (start, end) => {
    if (end <= start) return;
    const parent = stack[stack.length - 1];
    const raw = s.slice(start, end);
    parent.children.push({ type: "text", start, end, raw, value: decodeEntities(raw), parent });
  };

  while (i < s.length) {
    const lt = s.indexOf("<", i);
    if (lt === -1) {
      pushText(i, s.length);
      break;
    }
    pushText(i, lt);

    if (s.startsWith("<!--", lt)) {
      const end = s.indexOf("-->", lt + 4);
      if (end === -1) throw new Error(`unterminated comment at offset ${lt}`);
      i = end + 3;
      continue;
    }
    if (s.startsWith("<![CDATA[", lt)) {
      const end = s.indexOf("]]>", lt + 9);
      if (end === -1) throw new Error(`unterminated CDATA at offset ${lt}`);
      const parent = stack[stack.length - 1];
      const raw = s.slice(lt, end + 3);
      parent.children.push({
        type: "text", start: lt, end: end + 3, raw, value: s.slice(lt + 9, end), parent, cdata: true,
      });
      i = end + 3;
      continue;
    }
    if (s.startsWith("<?", lt)) {
      const end = s.indexOf("?>", lt + 2);
      if (end === -1) throw new Error(`unterminated processing instruction at offset ${lt}`);
      i = end + 2;
      continue;
    }
    if (s.startsWith("<!", lt)) {
      i = findTagEnd(s, lt + 2) + 1;
      continue;
    }

    const gt = findTagEnd(s, lt + 1);
    if (s[lt + 1] === "/") {
      const name = s.slice(lt + 2, gt).trim();
      const node = stack.pop();
      if (!node || node.type !== "el" || node.name !== name) {
        throw new Error(`mismatched end tag </${name}> at offset ${lt}`);
      }
      node.closeStart = lt;
      node.end = gt + 1;
      i = gt + 1;
      continue;
    }

    const selfClosing = s[gt - 1] === "/";
    const inner = s.slice(lt + 1, selfClosing ? gt - 1 : gt);
    const nameMatch = /^[^\s/>]+/.exec(inner);
    const name = nameMatch[0];
    const parent = stack[stack.length - 1];
    const node = {
      type: "el",
      name,
      attrs: parseAttributes(inner.slice(name.length)),
      start: lt,
      openEnd: gt + 1,
      closeStart: gt + 1,
      end: gt + 1,
      selfClosing,
      children: [],
      parent,
    };
    parent.children.push(node);
    if (!selfClosing) stack.push(node);
    i = gt + 1;
  }
  if (stack.length !== 1) {
    throw new Error(`unclosed element <${stack[stack.length - 1].name}>`);
  }
  return root;
}

export function localName(node) {
  const colon = node.name.indexOf(":");
  return colon === -1 ? node.name : node.name.slice(colon + 1);
}

export function prefixOf(node) {
  const colon = node.name.indexOf(":");
  return colon === -1 ? "" : node.name.slice(0, colon);
}

export function elementChildren(node) {
  return node.children.filter((c) => c.type === "el");
}

/** Every descendant element (document order) matching `predicate`. */
export function findAll(node, predicate, { stopAt } = {}) {
  const out = [];
  const walk = (n) => {
    for (const child of n.children) {
      if (child.type !== "el") continue;
      if (predicate(child)) {
        out.push(child);
        if (stopAt?.(child)) continue;
      }
      walk(child);
    }
  };
  walk(node);
  return out;
}

export function directChild(node, name) {
  return node.children.find((c) => c.type === "el" && c.name === name) ?? null;
}

/** Decoded text of every text node under `node` (no markup). */
export function textContent(node) {
  if (node.type === "text") return node.value;
  let out = "";
  for (const child of node.children) out += textContent(child);
  return out;
}
