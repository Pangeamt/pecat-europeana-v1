"use server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { evaluateTuDraftService, evaluateTuSchema } from "@/modules/tus";

// Live draft evaluation for the TU editor: fresh MTQE score + LLM verdict/
// suggestion for the in-progress target. Read-only — persists nothing.
export const POST = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await evaluateTuSchema.validateAsync(body);
    const result = await evaluateTuDraftService(payload, actorUser);
    return Response.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
};
