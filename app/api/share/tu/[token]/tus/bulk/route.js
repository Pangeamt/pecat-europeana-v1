import { toErrorResponse } from "@/modules/shared";
import {
  bulkConfirmTusSchema,
  confirmTusInBulkByShareTokenService,
} from "@/modules/tus";

// "Confirm all" for the public "share as translator" link: the token is the
// authorization and names the document (mirrors app/api/tus/bulk/route.js).
export const POST = async (req, { params }) => {
  try {
    const { token } = await params;
    const body = await req.json();
    const payload = await bulkConfirmTusSchema.validateAsync(body);
    const result = await confirmTusInBulkByShareTokenService(token, payload);
    return Response.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
};
