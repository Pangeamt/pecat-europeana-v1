import { toErrorResponse } from "@/modules/shared";
import {
  bulkReplaceTusSchema,
  replaceTusInBulkByShareTokenService,
} from "@/modules/tus";

// Bulk edit for the public "share as translator" link: the token is the
// authorization and names the document (mirrors app/api/tus/bulk-edit).
export const POST = async (req, { params }) => {
  try {
    const { token } = await params;
    const body = await req.json();
    const payload = await bulkReplaceTusSchema.validateAsync(body);
    const result = await replaceTusInBulkByShareTokenService(token, payload);
    return Response.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
};
