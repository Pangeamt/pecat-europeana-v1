"use server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { bulkConfirmTusSchema, confirmTusInBulkService } from "@/modules/tus";

// Confirms a LIST of segments of one document in a single request ("Confirm
// all" in the editor). Answers { updated, failed }: the rows as they were
// left (the confirmed ones and the same-source ones they propagated to) and
// the ones refused, each with its reason.
export const POST = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await bulkConfirmTusSchema.validateAsync(body);
    const result = await confirmTusInBulkService(payload, actorUser);
    return Response.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
};
