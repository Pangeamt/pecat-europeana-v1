import { NextResponse } from "next/server";
import { toErrorResponse } from "@/modules/shared";
import { getDocumentConfigByShareTokenService } from "@/modules/documents";

// Public "share as translator" link — no requireAuthUser(), the token is
// the authorization. Feeds the standalone /share/tu/[token] editor.
export const GET = async (_req, { params }) => {
  try {
    const { token } = await params;
    const document = await getDocumentConfigByShareTokenService(token);
    return NextResponse.json(document, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to get shared document");
  }
};
