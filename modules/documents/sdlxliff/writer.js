import { randomUUID } from "node:crypto";
import { DOMParser } from "@xmldom/xmldom";
import { codeSource, codeTarget, tagSequence, TOKEN_RE } from "./codes.js";
import { indexSdlxliff, isPlainLocked } from "./reader.js";
import { findAll } from "./xmltree.js";
import { exportTarget, isApproved } from "../export-target.js";

// Writes our translations INTO the client's original SDLXLIFF by splicing the
// raw text at the offsets of our target <mrk>s and their <sdl:seg> tags.
// Everything else stays byte-identical (BOM, CRLF, entities, attribute order).
//
// The rules are module-file-translate's (app/xliff/sdl_merge.py), which went
// through the same fire: Okapi/any model-based rewrite broke 4,047 of 4,047
// deliverables in Trados ("Corrupt file: Missing locked content").
//   1. Address segments by (trans-unit id, mid) only.
//   2. Write only into <mrk mtype="seg"> that already exist in the target;
//      never create <target>/<mrk> (a key without place is counted).
//   3. Write only what is ours; never touch locked segments.
//   4. Inline tags are COPIED from the seg-source (original bytes), and the
//      tag signature (type+id, in order) must equal the source's -- else the
//      segment is not written ("ante la duda no se escribe") and is counted.
//   5. Each target gets its OWN lockTU copy: source, seg-source and target
//      reference different lockTU_* trans-units. Sharing one = corrupt file.
//   6. Never write empty content; never lose a lockTU reference.
//   7. The target's outer whitespace mirrors the seg-source's.
// Plain XLIFF 1.2 (.xlf/.xliff) goes through the SAME writer: a unit with no
// <mrk mtype="seg"> is its own segment, its <target> is created right after
// <source> when the client's file has none, and the segment state goes on the
// <target state="..."> (there is no <sdl:seg>). Measured on 5 real client files
// that a Tikal round trip does NOT give the file back (it fills empty targets
// with the source, mangles non-ASCII without -ie/-oe UTF-8 and reformats);
// this one changes only our targets.
// Not copied from MFT: its two known gaps (overwriting client translations,
// losing human edits of tagged segments) -- see the comparison doc.

// What each segment says in the exported file, in Trados' own terms (the
// grid's situations are another matter: lib/segment-status.js). A reviewer who
// confirms a segment is the translator of that segment, so it leaves as
// "Translated" -- never as a review-level approval nobody gave:
//
//   confirmed, text changed by the reviewer   Translated, origin interactive
//   confirmed as DAAIT left it                Translated, origin mt (Trados "AT")
//   confirmed as the client's file had it     Translated, its own origin kept
//   rejected                                  RejectedTranslation
//   exact memory match (auto-locked)          Translated, origin tm, 100
//   DAAIT's, nobody confirmed it              Draft, origin mt
//   untouched client target / locked          not written at all
export const CONF = {
  edited: { conf: "Translated", origin: "interactive" },
  confirmedMt: { conf: "Translated", origin: "mt" },
  confirmed: { conf: "Translated" },
  rejected: { conf: "RejectedTranslation", origin: "interactive" },
  tm: { conf: "Translated", origin: "tm", percent: "100" },
  mt: { conf: "Draft", origin: "mt" },
};

const LOCKTU_XID_RE = /\bxid\s*=\s*("lockTU_[^"]*"|'lockTU_[^']*')/g;

function escapeText(text, eol) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\r?\n/g, eol);
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

/** Sets attributes on a start tag in place (value replaced where the attribute already is, appended otherwise). */
export function setAttributes(tag, attrs) {
  let out = tag;
  for (const [name, value] of Object.entries(attrs)) {
    const re = new RegExp(`(\\s${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*=\\s*)("[^"]*"|'[^']*')`);
    if (re.test(out)) {
      out = out.replace(re, `$1"${escapeAttr(value)}"`);
    } else {
      out = out.replace(/(\s*\/?>)$/, ` ${name}="${escapeAttr(value)}"$1`);
    }
  }
  return out;
}

// XLIFF 1.2 target states for plain files (the counterpart of CONF above).
// The pairs are the ones Trados itself writes when it saves an SDLXLIFF as
// XLIFF (measured on a file prepared in Trados, see revisions-pangeanic-local
// utils/parsers.py): Draft = needs-translation, Translated = translated,
// ApprovedTranslation = signed-off, ApprovedSignOff = final. Until 2026-10-06
// a confirmed segment left as "signed-off" (a review approval, and a LOCK for
// XTM) and DAAIT's unconfirmed text as "needs-review-translation" -- the same
// state as a rejection, which Trados shows as rejected, not as a draft.
const STATE = {
  approved: "translated",
  rejected: "needs-review-translation",
  tm: "translated",
  mt: "needs-translation",
};

// XLIFF 2.x has four states, on <segment> (initial | translated | reviewed | final).
const STATE_V2 = {
  approved: "reviewed",
  rejected: "initial",
  tm: "translated",
  mt: "translated",
};

function stateFor(tu, v2 = false) {
  const S = v2 ? STATE_V2 : STATE;
  if (tu.Status === "REJECTED") return S.rejected;
  if (isReviewed(tu)) return S.approved;
  if (tu.blockReason === "TM_MATCH") return S.tm;
  return S.mt;
}

/** A <target> for a plain unit that has none, right after its <source>, with the source's indentation. */
function newTarget(raw, source, inner, state, eol) {
  const nl = raw.lastIndexOf("\n", source.start);
  const before = raw.slice(nl + 1, source.start);
  const indent = nl !== -1 && /^[ \t]*$/.test(before) ? before : "";
  // `state` is null for XLIFF 2.x: there it goes on <segment>, not on <target>.
  const attr = state ? ` state="${state}"` : "";
  return `${indent ? eol + indent : ""}<target${attr}>${inner}</target>`;
}

function isReviewed(tu) {
  return tu.reviewLiteral != null && isApproved(tu);
}

// `changed` = the text written differs from what the file had in that segment.
function confFor(tu, changed = true) {
  if (tu.Status === "REJECTED") return CONF.rejected;
  if (isReviewed(tu)) {
    if (tu.Status === "EDITED") return CONF.edited;
    // Confirmed as it was: the client's own target keeps its origin; DAAIT's
    // keeps saying it is machine translation.
    return changed && tu.fileTarget !== true ? CONF.confirmedMt : CONF.confirmed;
  }
  if (tu.blockReason === "TM_MATCH") return CONF.tm;
  return CONF.mt;
}

/** Placeholders -> the original bytes of the seg-source's inline codes. */
function buildInner(coded, codes, raw, eol) {
  let out = "";
  let last = 0;
  const selfClosedG = new Set();
  for (const match of coded.matchAll(new RegExp(TOKEN_RE.source, "g"))) {
    const [full, closing, letter, num, selfClosing] = match;
    out += escapeText(coded.slice(last, match.index), eol);
    last = match.index + full.length;
    const key = letter + num;
    const node = codes.get(key);
    if (!node) throw new Error(`unknown inline code <${key}>`);
    if (letter === "g") {
      if (closing) {
        if (selfClosedG.has(key)) continue;
        out += `</${node.name}>`;
      } else if (node.selfClosing) {
        out += raw.slice(node.start, node.end);
        if (!selfClosing) selfClosedG.add(key);
      } else if (selfClosing) {
        out += raw.slice(node.start, node.openEnd) + `</${node.name}>`;
      } else {
        out += raw.slice(node.start, node.openEnd);
      }
    } else {
      out += raw.slice(node.start, node.end);
    }
  }
  out += escapeText(coded.slice(last), eol);
  return out;
}

function edges(mrk) {
  const first = mrk.children[0];
  const lastChild = mrk.children[mrk.children.length - 1];
  const lead = first?.type === "text" ? /^\s*/.exec(first.raw)[0] : "";
  const trail = lastChild?.type === "text" ? /\s*$/.exec(lastChild.raw)[0] : "";
  // A text-only whitespace segment would count twice: keep one side.
  return first === lastChild && first?.type === "text" && !first.raw.trim()
    ? { lead, trail: "" }
    : { lead, trail };
}

function lockTuXids(text) {
  return [...text.matchAll(LOCKTU_XID_RE)].map((m) => m[1].slice(1, -1));
}

/** MFT's Studio invariants: shared lockTU refs, orphan lockTU defs, seg mrks without sdl:seg. */
export function invariants(raw) {
  const index = indexSdlxliff(raw);
  const refs = new Map();
  for (const x of findAll(index.root, (n) => /^lockTU_/.test(n.attrs.get("xid") ?? ""))) {
    const xid = x.attrs.get("xid");
    refs.set(xid, (refs.get(xid) ?? 0) + 1);
  }
  const lockDefs = index.units.filter((u) => u.id.startsWith("lockTU_")).map((u) => u.id);
  let withoutSeg = 0;
  for (const unit of index.units) {
    for (const mid of new Set([...unit.sourceMrks.keys(), ...unit.targetMrks.keys()])) {
      if (!unit.sdlSegs.has(mid)) withoutSeg++;
    }
  }
  return {
    shared: [...refs.values()].filter((n) => n > 1).length,
    orphans: lockDefs.filter((id) => !refs.has(id)).length,
    withoutSeg,
  };
}

function assertWellFormed(text) {
  const body = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  new DOMParser({
    onError: (level, message) => {
      if (level !== "warning") throw new Error(`output is not well-formed: ${message}`);
    },
  }).parseFromString(body, "text/xml");
}

/**
 * @param raw  original file text (as read with "utf8": BOM kept)
 * @param tus  Tu rows: { externalId, srcLiteral, translatedLiteral, reviewLiteral, Status, blockReason }
 * @returns { text, report }
 */
export function writeSdlxliff(raw, tus) {
  const index = indexSdlxliff(raw);
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const report = {
    written: 0,
    confirmed: 0,
    unchanged: 0,
    skippedLocked: 0,
    skippedTags: 0,
    skippedLegacy: 0,
    skippedLockTu: 0,
    noPlace: 0,
    lockTuCloned: 0,
    targetCreated: 0,
  };
  const splices = [];

  for (const tu of tus) {
    const text = exportTarget(tu).trim();
    if (!text || !tu.externalId) continue;
    const sep = tu.externalId.indexOf("::");
    const unitKey = sep === -1 ? tu.externalId : tu.externalId.slice(0, sep);
    // unitById as a fallback: documents imported before multi-<file> keys.
    const unit = index.unitByKey.get(unitKey) ?? index.unitById.get(unitKey);
    const mid = sep === -1 ? null : tu.externalId.slice(sep + 2);
    // Plain XLIFF unit (no <mrk mtype="seg">): the unit IS the segment and its
    // <target> may not exist yet (created below, right after <source>).
    const plain = Boolean(unit) && mid === null && unit.sourceMrks.size === 0;
    const srcMrk = plain ? unit.source : unit && mid !== null ? unit.sourceMrks.get(mid) : null;
    const tgtMrk = plain ? unit.target : unit && mid !== null ? unit.targetMrks.get(mid) : null;
    if (!srcMrk || (!tgtMrk && !plain)) {
      report.noPlace++;
      continue;
    }
    const seg = plain ? undefined : unit.sdlSegs.get(mid);
    const locked = plain
      ? isPlainLocked(unit)
      : /^(true|yes|1|y)$/i.test(seg?.attrs.get("locked") ?? "");
    if (!unit.translatable || locked || tu.blockReason === "INTERNAL") {
      report.skippedLocked++;
      continue;
    }

    const { coded: srcCoded, codes, byId } = codeSource(srcMrk);
    const changed = !tgtMrk || text !== codeTarget(tgtMrk, byId).trim();
    const reviewed = isReviewed(tu) || tu.Status === "REJECTED";
    if (!changed && !reviewed) {
      // The client's own target, untouched: not ours, not reconfirmed -- and
      // not "skipped" either, whatever its tags are (we write nothing).
      report.unchanged++;
      continue;
    }

    const want = tagSequence(srcCoded).join("");
    const got = tagSequence(text).join("");
    if (want !== got) {
      if (!got && codes.size) report.skippedLegacy++;
      else report.skippedTags++;
      continue;
    }

    if (changed) {
      const { lead, trail } = edges(srcMrk);
      let inner = lead + buildInner(text, codes, raw, eol) + trail;

      // Rule 5: the copied tags carry the SEG-SOURCE's lockTU xids. Give the
      // target back its own previous xids first; clone a definition for any
      // extra one.
      const previous = tgtMrk ? lockTuXids(raw.slice(tgtMrk.openEnd, tgtMrk.closeStart)) : [];
      const incoming = lockTuXids(inner);
      if (incoming.length < previous.length) {
        report.skippedLockTu++;
        continue;
      }
      let i = 0;
      let failed = false;
      const clones = [];
      inner = inner.replace(LOCKTU_XID_RE, (whole, quoted) => {
        const srcXid = quoted.slice(1, -1);
        const own = previous[i++];
        if (own) return whole.replace(srcXid, own);
        const def = index.unitById.get(srcXid);
        if (!def) {
          failed = true;
          return whole;
        }
        const newId = `lockTU_${randomUUID()}`;
        const defRaw = raw.slice(def.node.start, def.node.end);
        const defTagEnd = def.node.openEnd - def.node.start;
        const clone = setAttributes(defRaw.slice(0, defTagEnd), { id: newId }) + defRaw.slice(defTagEnd);
        clones.push({ at: def.node.end, text: eol + clone });
        return whole.replace(srcXid, newId);
      });
      if (failed) {
        report.skippedLockTu++;
        continue;
      }
      report.lockTuCloned += clones.length;
      for (const c of clones) splices.push({ start: c.at, end: c.at, text: c.text });

      if (!tgtMrk) {
        splices.push({
          start: srcMrk.end,
          end: srcMrk.end,
          text: newTarget(raw, srcMrk, inner, unit.v2 ? null : stateFor(tu), eol),
        });
        report.targetCreated++;
      } else if (tgtMrk.selfClosing) {
        let open = raw.slice(tgtMrk.start, tgtMrk.end).replace(/\s*\/>$/, ">");
        if (plain && !unit.v2) open = setAttributes(open, { state: stateFor(tu) });
        splices.push({ start: tgtMrk.start, end: tgtMrk.end, text: `${open}${inner}</${tgtMrk.name}>` });
      } else {
        if (plain && !unit.v2) {
          splices.push({
            start: tgtMrk.start,
            end: tgtMrk.openEnd,
            text: setAttributes(raw.slice(tgtMrk.start, tgtMrk.openEnd), { state: stateFor(tu) }),
          });
        }
        splices.push({ start: tgtMrk.openEnd, end: tgtMrk.closeStart, text: inner });
      }
      report.written++;
    } else {
      report.unchanged++;
    }

    if (seg) {
      splices.push({
        start: seg.start,
        end: seg.openEnd,
        text: setAttributes(raw.slice(seg.start, seg.openEnd), confFor(tu, changed)),
      });
      report.confirmed++;
    } else if (plain && unit.v2) {
      // XLIFF 2.x: the state is an attribute of <segment>, for what we wrote
      // and for what a reviewer confirmed (a client translation nobody
      // touched never gets here: `unchanged`, above).
      splices.push({
        start: unit.node.start,
        end: unit.node.openEnd,
        text: setAttributes(raw.slice(unit.node.start, unit.node.openEnd), { state: stateFor(tu, true) }),
      });
      report.confirmed++;
    } else if (plain && tgtMrk && !changed && !tgtMrk.selfClosing) {
      // The client's own target, confirmed by a reviewer: only its state moves.
      splices.push({
        start: tgtMrk.start,
        end: tgtMrk.openEnd,
        text: setAttributes(raw.slice(tgtMrk.start, tgtMrk.openEnd), { state: stateFor(tu) }),
      });
      report.confirmed++;
    } else if (plain && changed) {
      report.confirmed++;
    }
  }

  // Apply back to front so earlier offsets stay valid.
  splices.sort((a, b) => b.start - a.start || b.end - a.end);
  let text = raw;
  for (const s of splices) text = text.slice(0, s.start) + s.text + text.slice(s.end);

  if (splices.length) {
    assertWellFormed(text);
    const before = invariants(raw);
    const after = invariants(text);
    for (const k of Object.keys(after)) {
      if (after[k] > before[k]) {
        throw new Error(`SDLXLIFF invariant broken (${k}: ${before[k]} -> ${after[k]}); nothing was delivered`);
      }
    }
  }
  return { text, report };
}
