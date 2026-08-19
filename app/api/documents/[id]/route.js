import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  getDocumentByIdService,
  softDeleteDocumentService,
  updateDocumentSchema,
  updateDocumentLabelService,
} from "@/modules/documents";

export const GET = async (_, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const document = await getDocumentByIdService(id, actorUser);
    return NextResponse.json(document, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to get document");
  }
};

export const PATCH = async (req, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await updateDocumentSchema.validateAsync(body);
    await updateDocumentLabelService(id, payload.label, actorUser);
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to update document");
  }
};

export const DELETE = async (_, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    await softDeleteDocumentService(id, actorUser);
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to delete document");
  }
};
