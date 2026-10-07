import { TOKEN_RE } from "./codes.js";

// Sentence segmentation of a plain XLIFF 1.2 unit (.xlf/.xliff), the way
// Trados Studio does it when it opens the same file: a unit that arrives
// WITHOUT a translation is cut into its sentences, so the grid shows -- and
// numbers -- the same segments as the client's CAT tool. A unit that already
// carries a target is never cut (its translation could not be cut with it).
//
// The rule was measured against Studio 2019 on the client's own file
// (environment_fr.json.xlf, en-GB, 1,555 units -> 1,577 segments, identical):
//   - break after . ? ! or : followed by whitespace,
//   - unless the next word starts in lower case ("i.e. the", "football: extremes"),
//   - nor after a single capital letter and a full stop ("32°C. This", initials).
// Inline codes do not count: the rule reads the text a human reads.
const BREAK_RE = /(?<=[.?!:])(?<!(?<!\p{L})\p{Lu}\.)\s+(?!\p{Ll})(?=\S)/gu;

// The `mid` of a sentence cut here ("~1", "~2"...): no real <mrk mid=""> can
// collide with it, and the writer knows the unit has to be put back together.
export const VIRTUAL_MID_PREFIX = "~";

export const virtualMid = (position) => `${VIRTUAL_MID_PREFIX}${position + 1}`;

export const isVirtualMid = (mid) => typeof mid === "string" && mid.startsWith(VIRTUAL_MID_PREFIX);

/**
 * Cuts the coded text of a unit (inline codes as <g1>, <x2/>...) into its
 * sentences. Returns [{ gap, text }]: `gap` is the whitespace that separated
 * the sentence from the previous one ("" for the first), so that joining every
 * gap + text gives the input back, byte for byte. A code next to a break stays
 * with the sentence it touches. A break that would leave a <gN>...</gN> pair
 * half in each sentence is not made.
 */
export function splitCoded(coded) {
  const input = String(coded ?? "");
  // The text a human reads, with the position of each character in `input`.
  let visible = "";
  const positions = [];
  // Depth of open <gN> pairs BEFORE each position of `input`.
  const depthAt = new Array(input.length + 1).fill(0);
  let depth = 0;
  let last = 0;
  const take = (from, to) => {
    for (let i = from; i < to; i += 1) {
      depthAt[i] = depth;
      positions.push(i);
      visible += input[i];
    }
  };
  for (const match of input.matchAll(new RegExp(TOKEN_RE.source, "g"))) {
    take(last, match.index);
    const [full, closing, letter, , selfClosing] = match;
    for (let i = match.index; i < match.index + full.length; i += 1) depthAt[i] = depth;
    if (letter === "g" && !selfClosing) depth += closing ? -1 : 1;
    last = match.index + full.length;
  }
  take(last, input.length);
  depthAt[input.length] = depth;

  const parts = [];
  let start = 0;
  let gap = "";
  for (const match of visible.matchAll(BREAK_RE)) {
    // In `input`: the first whitespace after the punctuation ends the sentence;
    // that run of whitespace is the gap; whatever follows opens the next one.
    const gapStart = positions[match.index];
    let gapEnd = gapStart;
    while (gapEnd < input.length && /\s/u.test(input[gapEnd])) gapEnd += 1;
    if (depthAt[gapStart] !== 0) continue;
    parts.push({ gap, text: input.slice(start, gapStart) });
    gap = input.slice(gapStart, gapEnd);
    start = gapEnd;
  }
  parts.push({ gap, text: input.slice(start) });
  return parts;
}
