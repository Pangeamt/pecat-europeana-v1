import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  updateDocumentTmsSchema,
  updateDocumentTmsService,
} from "@/modules/documents";

export const PATCH = async (req, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await updateDocumentTmsSchema.validateAsync(body);
    const result = await updateDocumentTmsService(
      id,
      payload.updateTmIds,
      actorUser,
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/documents/[id]/tms failed:", error);
    return toErrorResponse(error, "Failed to update document TMs");
  }
};
