import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  documentSubmissionSchema,
  submitDocumentService,
  reopenDocumentService,
} from "@/modules/documents";

export const POST = async (req, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await documentSubmissionSchema.validateAsync(body);
    const result =
      payload.action === "submit"
        ? await submitDocumentService(id, payload.role, actorUser)
        : await reopenDocumentService(id, payload.role, actorUser);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("POST /api/documents/[id]/submission failed:", error);
    return toErrorResponse(error, "Failed to update document submission");
  }
};
