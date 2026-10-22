"use server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { bulkLockTusSchema, lockTusInBulkService } from "@/modules/tus";

// Locks or unlocks a LIST of segments of one document in a single request
// ("Lock / unlock the filtered segments" in the editor, ADMIN/SUPER only).
// Answers { updated, failed, skipped }: the rows as they were left, the ones
// refused with their reason, and how many were already as asked.
export const POST = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await bulkLockTusSchema.validateAsync(body);
    const result = await lockTusInBulkService(payload, actorUser);
    return Response.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
};
