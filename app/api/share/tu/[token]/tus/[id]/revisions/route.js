import { toErrorResponse } from "@/modules/shared";
import { listTuRevisionsByShareTokenService } from "@/modules/tus";

// Public "share as translator" link: the token is the authorization, and the
// segment must belong to that token's document.
export const GET = async (_req, { params }) => {
  try {
    const { token, id } = await params;
    const result = await listTuRevisionsByShareTokenService(token, id);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};
