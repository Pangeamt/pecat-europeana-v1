import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  assignDocumentUserSchema,
  assignDocumentUserService,
} from "@/modules/documents";

export const PATCH = async (req, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await assignDocumentUserSchema.validateAsync(body);
    const result = await assignDocumentUserService(
      id,
      payload.role,
      payload.userId,
      actorUser,
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/documents/[id]/assignments failed:", error);
    return toErrorResponse(error, "Failed to update document assignment");
  }
};
