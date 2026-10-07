// Confirming a LIST of segments in one request (pure, no imports: node:test
// loads it; modules/tus/service.js runs the plan it returns and the editor
// cuts its list with `chunksOf`).

// Segments per request. The editor sends the whole list in requests of this
// size, one after the other, so a long list neither times out nor leaves the
// reviewer without news: each answer confirms its rows in the grid.
export const BULK_CONFIRM_CHUNK = 200;

// The most one request may carry (the API refuses more).
export const BULK_CONFIRM_MAX = 500;

/** The list cut into consecutive pieces of at most `size`. */
export function chunksOf(list, size = BULK_CONFIRM_CHUNK) {
  const out = [];
  const items = list ?? [];
  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size));
  }
  return out;
}

/**
 * What a bulk confirm has to do, decided before touching the database.
 *
 * `items` = [{ tuId, reviewLiteral }] in the order the reviewer sees them;
 * `rows` = every visible segment of the document; `refuse(row, text)` returns
 * null or { code, message } when that text cannot be saved for that row.
 *
 * Returns { jobs, failed }:
 *  - jobs: [{ tu, reviewLiteral }] to confirm, in order. A segment whose
 *    source equals an earlier job's is NOT a job of its own: confirming the
 *    first one propagates to it (same rule as confirming one by one).
 *  - failed: [{ tuId, code, message }] left as they were.
 */
export function planBulkConfirm(items, rows, refuse = () => null) {
  const byId = new Map((rows ?? []).map((row) => [row.id, row]));
  const jobs = [];
  const failed = [];
  const seen = new Set();
  // Sources an earlier job already confirms (its propagation covers them).
  const claimedSources = new Set();
  for (const item of items ?? []) {
    if (!item?.tuId || seen.has(item.tuId)) continue;
    seen.add(item.tuId);
    const tu = byId.get(item.tuId);
    if (!tu) {
      failed.push({ tuId: item.tuId, code: "NOT_FOUND", message: "Segment not found in this document" });
      continue;
    }
    if (tu.block) {
      failed.push({ tuId: tu.id, code: "SEGMENT_LOCKED", message: "This segment is locked" });
      continue;
    }
    if (claimedSources.has(tu.srcLiteral)) continue;
    const reviewLiteral = item.reviewLiteral ?? tu.reviewLiteral ?? tu.translatedLiteral ?? "";
    const refusal = refuse(tu, reviewLiteral);
    if (refusal) {
      failed.push({ tuId: tu.id, code: refusal.code ?? "REFUSED", message: refusal.message ?? "" });
      continue;
    }
    claimedSources.add(tu.srcLiteral);
    jobs.push({ tu, reviewLiteral });
  }
  return { jobs, failed };
}

/** Runs `worker` over `list` with at most `limit` at once; results keep the list's order. */
export async function mapWithLimit(list, limit, worker) {
  const results = new Array(list.length);
  let next = 0;
  const run = async () => {
    while (next < list.length) {
      const index = next;
      next += 1;
      results[index] = await worker(list[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, list.length)) }, run));
  return results;
}
