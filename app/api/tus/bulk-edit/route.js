"use server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { bulkReplaceTusSchema, replaceTusInBulkService } from "@/modules/tus";

// Bulk edit in the editor (find and replace, copy source, clear): saves the new
// text of a LIST of segments of one document. Answers { updated, failed,
// skipped }: the rows as they were left, the ones refused (locked, tags that
// no longer match...) with their reason, and how many needed no change.
export const POST = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await bulkReplaceTusSchema.validateAsync(body);
    const result = await replaceTusInBulkService(payload, actorUser);
    return Response.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
};
