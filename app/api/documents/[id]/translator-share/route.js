import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  getDocumentTranslatorShareService,
  generateDocumentTranslatorShareService,
  revokeDocumentTranslatorShareService,
} from "@/modules/documents";

export const GET = async (_req, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const result = await getDocumentTranslatorShareService(id, actorUser);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to get translator share link");
  }
};

export const POST = async (_req, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const result = await generateDocumentTranslatorShareService(id, actorUser);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to create translator share link");
  }
};

export const DELETE = async (_req, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    await revokeDocumentTranslatorShareService(id, actorUser);
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to revoke translator share link");
  }
};
