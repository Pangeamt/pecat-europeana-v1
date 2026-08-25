import { toErrorResponse } from "@/modules/shared";
import { evaluateTuDraftByShareTokenService, evaluateTuSchema } from "@/modules/tus";

// Public "share as translator" variant of the live draft evaluation — the
// token is the authorization (same pattern as the sibling tus route).
export const POST = async (req, { params }) => {
  try {
    const { token } = await params;
    const body = await req.json();
    const payload = await evaluateTuSchema.validateAsync(body);
    const result = await evaluateTuDraftByShareTokenService(token, payload);
    return Response.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
};
