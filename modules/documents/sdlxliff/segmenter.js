import { TOKEN_RE } from "./codes.js";
import { ABBREVIATIONS_EN } from "./abbreviations-en.js";

// Sentence segmentation of a plain XLIFF 1.2 unit (.xlf/.xliff), the way
// Trados Studio does it when it opens the same file: a unit that arrives
// WITHOUT a translation is cut into its sentences, so the grid shows -- and
// numbers -- the same segments as the client's CAT tool. A unit that already
// carries a target is never cut (its translation could not be cut with it).
//
// The rules are Trados' own default ones ("Generic segmentation rules for
// Western European languages", read from Studio 2019's language resources):
//
//   FullStopRule  .+   MarksRule  [!?]+   ColonRule  :+
//     each followed by any closing punctuation and then a whitespace.
//   Exceptions:
//     - lower-case follower: the character right after that whitespace is a
//       lower-case letter ("i.e. the", "football: extremes");
//     - abbreviation (full stop only): the text ends in a known abbreviation
//       ("32°C. This", "(e.g. HLA-B27)"), see abbreviations-en.js.
//
// Checked against Studio on the client's files: environment_fr.json.xlf
// (1,555 units -> 1,577 segments) and rheumatology_fr.json.xlf (1,388 units
// -> 1,409), same segments, same numbers. Inline codes do not count: the
// rules read the text a human reads.

// Punctuation that may sit between the mark and the whitespace: closing
// brackets and quotes, other punctuation -- except the separators Trados
// takes out of the set (comma, colon, semicolon and their look-alikes).
const NOT_TRAILING =
  ",:;՝،؛܃܄܅܆܇܈܉߸፣፤፥፦᠂᠄᠈⁏⁝、꘍︐︑︓︔﹐﹑﹔﹕，：；､";
const TRAILING = `(?:(?![${NOT_TRAILING}])[\\p{Pe}\\p{Pf}\\p{Po}"])*`;
const ANY_TRAILING = `[\\p{Pe}\\p{Pf}\\p{Po}"]*`;

// One entry per rule: `ends` = the text before the whitespace ends like this;
// `lower` = the same ending as the lower-case exception reads it.
const RULES = [
  { name: "fullStop", mark: "\\.+", abbreviations: true },
  { name: "marks", mark: "[!?]+", abbreviations: false },
  { name: "colon", mark: ":+", abbreviations: false },
].map((rule) => ({
  ...rule,
  ends: new RegExp(`${rule.mark}${TRAILING}$`, "u"),
  lower: new RegExp(`${rule.mark}${ANY_TRAILING}$`, "u"),
}));

const LOWER = /^\p{Ll}/u;
const WHITESPACE = /\s/u;
// What may come right before an abbreviation for it to count as one.
const WORD_BEFORE = /[\p{Ll}\p{Lu}\p{Lt}\p{Lo}\p{Nd}\p{Pc}\p{Lm}\p{Po}]/u;
// Closing punctuation (never a full stop) allowed after the abbreviation.
const AFTER_ABBREVIATION = /(?:(?!\.)[\p{Pe}\p{Pf}\p{Po}"])+$/u;

const ABBREVIATIONS = { en: ABBREVIATIONS_EN };
const LONGEST = Math.max(...[...ABBREVIATIONS_EN].map((item) => item.length));

/** The abbreviation list for a language tag ("en-GB" -> English), or null. */
function abbreviationsFor(language) {
  const primary = String(language ?? "").trim().toLowerCase().split(/[-_]/)[0];
  return ABBREVIATIONS[primary] ?? null;
}

function endsInAbbreviation(before, abbreviations) {
  if (!abbreviations) return false;
  const text = before.replace(AFTER_ABBREVIATION, "");
  for (let length = Math.min(LONGEST, text.length); length >= 2; length -= 1) {
    const start = text.length - length;
    if (!abbreviations.has(text.slice(start))) continue;
    const previous = start === 0 ? "" : text[start - 1];
    if (start === 0 || previous === '"' || !WORD_BEFORE.test(previous)) return true;
  }
  return false;
}

/**
 * Whether the visible text breaks at `index` (the position of a whitespace):
 * some rule matches the text before it and none of its exceptions applies.
 */
function breaksAt(visible, index, abbreviations) {
  const before = visible.slice(0, index);
  const follower = visible.slice(index + 1, index + 3);
  for (const rule of RULES) {
    if (!rule.ends.test(before)) continue;
    if (LOWER.test(follower) && rule.lower.test(before)) continue;
    if (rule.abbreviations && endsInAbbreviation(before, abbreviations)) continue;
    return true;
  }
  return false;
}

// The `mid` of a sentence cut here ("~1", "~2"...): no real <mrk mid=""> can
// collide with it, and the writer knows the unit has to be put back together.
export const VIRTUAL_MID_PREFIX = "~";

export const virtualMid = (position) => `${VIRTUAL_MID_PREFIX}${position + 1}`;

export const isVirtualMid = (mid) => typeof mid === "string" && mid.startsWith(VIRTUAL_MID_PREFIX);

/**
 * Cuts the coded text of a unit (inline codes as <g1>, <x2/>...) into its
 * sentences. `language` = the document's source language (it picks the
 * abbreviation list). Returns [{ gap, text }]: `gap` is the whitespace that
 * separated the sentence from the previous one ("" for the first), so that
 * joining every gap + text gives the input back, byte for byte. A code next to
 * a break stays with the sentence it touches. A break that would leave a
 * <gN>...</gN> pair half in each sentence is not made.
 */
export function splitCoded(coded, { language = "en" } = {}) {
  const input = String(coded ?? "");
  const abbreviations = abbreviationsFor(language);
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
  for (let index = 1; index < visible.length; index += 1) {
    if (!WHITESPACE.test(visible[index]) || WHITESPACE.test(visible[index - 1])) continue;
    // Nothing but whitespace after it: the end of the unit, not a break.
    if (!visible.slice(index).trim()) break;
    if (!breaksAt(visible, index, abbreviations)) continue;
    // In `input`: this whitespace ends the sentence; its run is the gap;
    // whatever follows opens the next one.
    const gapStart = positions[index];
    let gapEnd = gapStart;
    while (gapEnd < input.length && WHITESPACE.test(input[gapEnd])) gapEnd += 1;
    if (depthAt[gapStart] !== 0) continue;
    parts.push({ gap, text: input.slice(start, gapStart) });
    gap = input.slice(gapStart, gapEnd);
    start = gapEnd;
  }
  parts.push({ gap, text: input.slice(start) });
  return parts;
}

// Standalone codes (<xN/>: <x/>, <ph>, <it>...) at the very start or end of a
// unit that arrives with no translation are NOT part of its segments: Trados
// leaves them outside the segment (measured on Studio 2022: in every unit it
// segments itself, no segment starts or ends with one), so the translator never
// sees them and the export puts them back around the translation. Paired codes
// (<gN>, <bN/>/<eN/>) wrap text and stay inside.
const LEADING_CODES = /^(?:<x\d+\/>\s*)+/;
const TRAILING_CODES = /(?:\s*<x\d+\/>)+$/;

/**
 * Splits the coded text of a unit into { lead, core, trail }: `lead` and
 * `trail` are the edge codes (with the whitespace that separates them from
 * the text) and `core` is what a human translates. lead + core + trail is the
 * input, byte for byte. A unit that is nothing but codes is left whole.
 */
export function peelEdgeCodes(coded) {
  const input = String(coded ?? "");
  const lead = LEADING_CODES.exec(input)?.[0] ?? "";
  const rest = input.slice(lead.length);
  const trail = TRAILING_CODES.exec(rest)?.[0] ?? "";
  const core = rest.slice(0, rest.length - trail.length);
  if (!core.trim()) return { lead: "", core: input, trail: "" };
  return { lead, core, trail };
}

/**
 * Finds the sentences a unit was cut into at import (`sources`, in order)
 * inside its coded text, and returns them as [{ gap, text }] -- or null when
 * they are not all there, in order, with nothing but whitespace between them.
 * The export joins by what was IMPORTED, so a later change of the rules above
 * never leaves a document's units impossible to put back together.
 */
export function locateSentences(coded, sources) {
  const input = String(coded ?? "");
  const parts = [];
  let cursor = 0;
  for (const source of sources ?? []) {
    const text = String(source ?? "");
    if (!text) return null;
    const at = input.indexOf(text, cursor);
    if (at === -1) return null;
    const gap = input.slice(cursor, at);
    if (gap.trim() || (parts.length === 0 && gap)) return null;
    parts.push({ gap, text });
    cursor = at + text.length;
  }
  if (parts.length === 0 || input.slice(cursor).trim()) return null;
  // Trailing whitespace of the unit stays with the last sentence's edge (the
  // writer adds the unit's own outer whitespace back).
  return parts;
}
