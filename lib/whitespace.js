// Whitespace characters: how the editor shows them (as Trados does) and how
// the server undoes the Quill NBSP flood. Pure, no imports: node:test loads it.
//
// The flood: Quill 2 (react-quill-new) handed the editor content as
// getSemanticHTML(), which writes every space as &nbsp;, so an untagged
// segment opened and confirmed was saved with U+00A0 in every gap, and its
// own NBSP, double spaces and line breaks were lost on load. The editor no
// longer does it (PR #107); the server repairs what an old page still sends.

const NBSP = " ";

// Trados (Studio 2024 SR1, "Whitespace Characters"): · normal space, ° NBSP.
// Trados draws every other space like a normal one; here each has its own.
export const WHITESPACE_KINDS = {
  " ": { kind: "space", mark: "·", name: "Space (U+0020)" },
  [NBSP]: { kind: "nbsp", mark: "°", name: "Non-breaking space (U+00A0)" },
  " ": { kind: "nnbsp", mark: "°", name: "Narrow non-breaking space (U+202F)" },
  " ": { kind: "other", mark: "∘", name: "Figure space (U+2007)" },
  " ": { kind: "other", mark: "∘", name: "En space (U+2002)" },
  " ": { kind: "other", mark: "∘", name: "Em space (U+2003)" },
  " ": { kind: "other", mark: "∘", name: "Thin space (U+2009)" },
  " ": { kind: "other", mark: "∘", name: "Hair space (U+200A)" },
  "　": { kind: "other", mark: "∘", name: "Ideographic space (U+3000)" },
  "\t": { kind: "tab", mark: "→", name: "Tab" },
  "\n": { kind: "break", mark: "↵", name: "Line break" },
};

/** Text split into runs: { text } plain, or { text, ws } one whitespace char. */
export function splitWhitespace(text) {
  const value = String(text ?? "");
  const parts = [];
  let plain = "";
  for (const ch of value) {
    const ws = WHITESPACE_KINDS[ch];
    if (!ws) {
      plain += ch;
      continue;
    }
    if (plain) parts.push({ text: plain });
    plain = "";
    parts.push({ text: ch, ws });
  }
  if (plain) parts.push({ text: plain });
  return parts;
}

// --- The flood -------------------------------------------------------------

const WORD_GAP_NBSP = /(?<=[\p{L}\p{N}]) (?=[\p{L}\p{N}])/gu;

/** Quill output: NBSP and no other whitespace at all. */
export function isQuillFlood(text) {
  return typeof text === "string" && text.includes(NBSP) && !/[^\S ]/u.test(text);
}

/**
 * Stricter, for the server: the flood with at least two NBSP between words, so
 * a short legitimate text ("20 %", "Question 7" with NBSP) is never touched.
 */
export function looksFlooded(text) {
  return isQuillFlood(text) && (text.match(WORD_GAP_NBSP) ?? []).length >= 2;
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: NBSP };
// Quill parsed the stored text as HTML on load: compare words the way it saw them.
const unescape = (word) =>
  word.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, code) => {
    if (code[0] !== "#") return ENTITIES[code.toLowerCase()] ?? all;
    const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return Number.isFinite(n) ? String.fromCodePoint(n) : all;
  });

function split(text) {
  const core = text.trim();
  return {
    lead: text.slice(0, text.length - text.trimStart().length),
    trail: text.slice(text.trimEnd().length),
    words: core ? core.split(/\s+/u) : [],
    seps: core.match(/\s+/gu) ?? [],
  };
}

// Longest common subsequence of two word lists, as [indexInB, indexInA] pairs.
function commonWords(b, a) {
  const n = b.length;
  const m = a.length;
  const len = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      len[i][j] = b[i] === a[j] ? len[i + 1][j + 1] + 1 : Math.max(len[i + 1][j], len[i][j + 1]);
    }
  }
  const pairs = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (b[i] === a[j]) {
      pairs.push([i, j]);
      i += 1;
      j += 1;
    } else if (len[i + 1][j] >= len[i][j + 1]) i += 1;
    else j += 1;
  }
  return pairs;
}

/**
 * Undo the flood of `saved` using `before` (the text the segment had).
 * Returns { text, kind, unknownGaps }:
 *   "skip"    not Quill output, or no `before`: `saved` untouched;
 *   "exact"   the reviewer changed no word: `before`, byte for byte;
 *   "aligned" the reviewer edited: words as saved, and every gap between two
 *             words kept from `before` gets its original separator; a gap next
 *             to an edited word takes the separator of the kept word beside it,
 *             or a normal space (unknownGaps counts them).
 */
export function repairQuillFlood(saved, before) {
  if (!isQuillFlood(saved) || typeof before !== "string") {
    return { text: saved, kind: "skip", unknownGaps: 0 };
  }
  const A = split(saved);
  const B = split(before);
  const keys = B.words.map(unescape);
  if (keys.length === A.words.length && keys.every((w, i) => w === A.words[i])) {
    return { text: before, kind: "exact", unknownGaps: 0 };
  }
  if (keys.length * A.words.length > 4_000_000) {
    return { text: saved.replaceAll(NBSP, " "), kind: "aligned", unknownGaps: A.seps.length };
  }
  // a index -> { b, equal }: equal words, and 1:1 substitutions of the same length.
  const mapping = new Map();
  let pb = 0;
  let pa = 0;
  const pairs = [...commonWords(keys, A.words), [keys.length, A.words.length]];
  for (const [bi, ai] of pairs) {
    if (bi - pb === ai - pa && bi > pb) {
      for (let k = 0; k < ai - pa; k += 1) mapping.set(pa + k, { b: pb + k, equal: false });
    }
    if (bi < keys.length) mapping.set(ai, { b: bi, equal: true });
    pb = bi + 1;
    pa = ai + 1;
  }
  const out = [];
  let unknownGaps = 0;
  if (mapping.get(0)?.b === 0) out.push(B.lead);
  A.words.forEach((word, i) => {
    const m = mapping.get(i);
    out.push(m?.equal ? B.words[m.b] : word);
    if (i === A.words.length - 1) return;
    const n = mapping.get(i + 1);
    if (m && n && n.b === m.b + 1) out.push(B.seps[m.b]);
    else {
      unknownGaps += 1;
      if (n?.equal && n.b > 0) out.push(B.seps[n.b - 1]);
      else if (m?.equal && m.b < B.seps.length) out.push(B.seps[m.b]);
      else out.push(" ");
    }
  });
  const last = mapping.get(A.words.length - 1);
  if (last && last.b === B.words.length - 1) out.push(B.trail);
  else if (A.trail) out.push(" ");
  return { text: out.join(""), kind: "aligned", unknownGaps };
}

/**
 * What the server saves for a review text: the text as sent, unless it carries
 * the flood, in which case it is repaired against the segment's previous text
 * (or its MT when the previous one was flooded too).
 */
export function keepReviewerSpaces(text, { previous, mt } = {}) {
  if (!looksFlooded(text)) return text;
  const base = typeof previous === "string" && previous && !isQuillFlood(previous) ? previous : mt;
  return typeof base === "string" && base ? repairQuillFlood(text, base).text : text;
}
