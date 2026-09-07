import { NextResponse } from "next/server";
import { toErrorResponse } from "@/modules/shared";
import { submitDocumentByShareTokenService } from "@/modules/documents";

// Anonymous translator link: submitting proves possession of the token,
// mirroring the other /api/share/tu/[token]/* endpoints (no session).
export const POST = async (_req, { params }) => {
  try {
    const { token } = await params;
    const result = await submitDocumentByShareTokenService(token);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("POST /api/share/tu/[token]/submit failed:", error);
    return toErrorResponse(error, "Failed to submit the translation");
  }
};
