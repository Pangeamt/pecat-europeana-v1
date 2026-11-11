// Segments whose saved target does not carry the source's tags. The editor's
// red banner counts them, and its "Show segments" button and the status
// filter's "Tag errors" option list exactly those same segments. Pure
// (relative imports only) so node:test loads it.
import { tagIssue, tagList } from "../modules/documents/tag-check.js";

/**
 * Whether a grid segment has a tag error: visible, not locked, with a saved
 * target (the confirmed text, else the MT), a source with tags, and target
 * tags that do not match the source's. `ordered` = the document is a splice
 * format (same rule as the editor and the export).
 */
export function hasTagError(tu, { ordered = false } = {}) {
  if (!tu || tu.visible === false || tu.block) return false;
  const target = tu.reviewLiteral || tu.translatedLiteral;
  if (!target || tagList(tu.srcLiteral).length === 0) return false;
  return !tagIssue(tu.srcLiteral, target, { ordered }).ok;
}
