// ONE tag check for server and client (pure, relative imports only, so
// node:test and the browser bundle load it as is). Before this the same rule
// lived in three places with different criteria: `inlineTagsMatch` (set),
// `assertInlineTagsKept` (set, or order for SDLXLIFF) and `tagsComplete`.
//
// The criterion: same tags, same count. For the splice formats (SDLXLIFF/XLIFF,
// `ordered`), whose export writes the tags back as XML, the tags may come in
// ANY order -- some languages need to move them -- but they must still form a
// tree: no crossed pairs, a start code before its end. Until 2026-11-11 the
// order had to be the source's, as in module-file-translate (FT-111): a target
// with the tags moved was flagged and the export left it out (writer.js gate).

const TAG_RE = /<\/?[gxbe]\d+\/?>/g;
const PAIR_RE = /^<(\/?)g(\d+)>$/;
const START_RE = /^<b(\d+)\/>$/;

/** The placeholder tags of a text, in order: ["<g1>", "</g1>", "<x2/>"]. */
export function tagList(text) {
  return (String(text ?? "").match(TAG_RE) ?? []).map((tag) => tag.replace(/\s+/g, ""));
}

const count = (list) => list.reduce((m, t) => m.set(t, (m.get(t) ?? 0) + 1), new Map());

/**
 * Where the <gN>…</gN> pairs of `list` stop nesting, said in words: a closing
 * tag that does not close the innermost pair still open (<g1><g2></g1></g2>),
 * one before its opening tag, or an opening tag never closed. null = a tree.
 */
function crossing(list) {
  const open = [];
  for (const tag of list) {
    const match = PAIR_RE.exec(tag);
    if (!match) continue;
    if (!match[1]) {
      open.push(match[2]);
      continue;
    }
    const last = open.pop();
    if (last === undefined) return `${tag} comes before its <g${match[2]}>`;
    if (last !== match[2]) return `${tag} closes while <g${last}> is still open`;
  }
  return open.length ? `<g${open[open.length - 1]}> is never closed` : null;
}

/**
 * A <bN/> and <eN/> of the same number (XLIFF <bpt>/<ept>, <sc>/<ec>: the start
 * and end of one code) keep the source's relative order: start, then end.
 */
function swappedEnds(expected, got) {
  for (const tag of expected) {
    const match = START_RE.exec(tag);
    if (!match) continue;
    const end = `<e${match[1]}/>`;
    const endAt = expected.indexOf(end);
    if (endAt < 0) continue;
    const startFirst = expected.indexOf(tag) < endAt;
    if (got.indexOf(tag) < got.indexOf(end) !== startFirst) {
      return startFirst ? `${end} comes before its ${tag}` : `${tag} comes before its ${end}`;
    }
  }
  return null;
}

/**
 * What is wrong with `target`'s tags against `source`'s:
 *   { ok, missing: [tag], extra: [tag], crossed: "why" | null, order: { expected, got } | null }
 * `ordered` (the splice formats) also fails when the tags no longer form a tree
 * (`crossed`). Only a source that is not a tree by itself -- a pair split
 * between two sentences of one unit -- keeps demanding its exact order
 * (`order`): there is no telling where the other half lands.
 */
export function tagIssue(source, target, { ordered = false } = {}) {
  const expected = tagList(source);
  const got = tagList(target);
  const want = count(expected);
  const have = count(got);
  const missing = [...want].filter(([t, n]) => (have.get(t) ?? 0) < n).map(([t]) => t);
  const extra = [...have].filter(([t, n]) => (want.get(t) ?? 0) < n).map(([t]) => t);
  let order = null;
  let crossed = null;
  if (ordered && !missing.length && !extra.length) {
    if (crossing(expected)) {
      if (expected.join("") !== got.join("")) order = { expected, got };
    } else {
      crossed = crossing(got) ?? swappedEnds(expected, got);
    }
  }
  return { ok: !missing.length && !extra.length && !order && !crossed, missing, extra, crossed, order };
}

/** Human-readable reason, the text of the 422 INLINE_TAGS_MISMATCH. */
export function describeTagIssue(issue) {
  const parts = [];
  if (issue.missing.length) parts.push(`missing ${issue.missing.join(" ")}`);
  if (issue.extra.length) parts.push(`extra ${issue.extra.join(" ")}`);
  if (issue.crossed) parts.push(`crossed tags: ${issue.crossed}`);
  if (issue.order) {
    parts.push(`wrong order: expected ${issue.order.expected.join(" ")}, got ${issue.order.got.join(" ")}`);
  }
  return parts.join("; ");
}
