import { randomUUID } from "node:crypto";
import { DOMParser } from "@xmldom/xmldom";
import { codeSource, codeTarget, tagSequence, TOKEN_RE } from "./codes.js";
import { indexSdlxliff } from "./reader.js";
import { findAll } from "./xmltree.js";

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
// Not copied from MFT: its two known gaps (overwriting client translations,
// losing human edits of tagged segments) -- see the comparison doc.

export const CONF = {
  approved: { conf: "ApprovedTranslation", origin: "interactive" },
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

function isReviewed(tu) {
  return tu.reviewLiteral != null && (tu.Status === "ACCEPTED" || tu.Status === "EDITED");
}

function confFor(tu) {
  if (tu.Status === "REJECTED") return CONF.rejected;
  if (isReviewed(tu)) return CONF.approved;
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
    if (letter === "g" && node.name.endsWith("g")) {
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
  };
  const splices = [];

  for (const tu of tus) {
    const text = (tu.reviewLiteral || tu.translatedLiteral || "").trim();
    if (!text || !tu.externalId) continue;
    const sep = tu.externalId.indexOf("::");
    const unit = index.unitById.get(sep === -1 ? tu.externalId : tu.externalId.slice(0, sep));
    const mid = sep === -1 ? null : tu.externalId.slice(sep + 2);
    const srcMrk = unit && mid !== null ? unit.sourceMrks.get(mid) : null;
    const tgtMrk = unit && mid !== null ? unit.targetMrks.get(mid) : null;
    if (!srcMrk || !tgtMrk) {
      report.noPlace++;
      continue;
    }
    const seg = unit.sdlSegs.get(mid);
    const locked = /^(true|yes|1|y)$/i.test(seg?.attrs.get("locked") ?? "");
    if (!unit.translatable || locked || tu.blockReason === "INTERNAL") {
      report.skippedLocked++;
      continue;
    }

    const { coded: srcCoded, codes, byId } = codeSource(srcMrk);
    const want = tagSequence(srcCoded).join("");
    const got = tagSequence(text).join("");
    if (want !== got) {
      if (!got && codes.size) report.skippedLegacy++;
      else report.skippedTags++;
      continue;
    }

    const changed = text !== codeTarget(tgtMrk, byId).trim();
    const reviewed = isReviewed(tu) || tu.Status === "REJECTED";
    if (!changed && !reviewed) {
      // The client's own target, untouched: not ours, not reconfirmed.
      report.unchanged++;
      continue;
    }

    if (changed) {
      const { lead, trail } = edges(srcMrk);
      let inner = lead + buildInner(text, codes, raw, eol) + trail;

      // Rule 5: the copied tags carry the SEG-SOURCE's lockTU xids. Give the
      // target back its own previous xids first; clone a definition for any
      // extra one.
      const previous = lockTuXids(raw.slice(tgtMrk.openEnd, tgtMrk.closeStart));
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

      if (tgtMrk.selfClosing) {
        const open = raw.slice(tgtMrk.start, tgtMrk.end).replace(/\s*\/>$/, ">");
        splices.push({ start: tgtMrk.start, end: tgtMrk.end, text: `${open}${inner}</${tgtMrk.name}>` });
      } else {
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
        text: setAttributes(raw.slice(seg.start, seg.openEnd), confFor(tu)),
      });
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
