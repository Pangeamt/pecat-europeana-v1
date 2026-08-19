import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { importDocumentsService } from "@/modules/documents";

// Multipart upload of one or more documents into a project. Besides file[],
// src and tgt, it accepts inherit_profile ("true"/"false"), tm_threshold and
// — only when not inheriting — tm_ids / tm_update_ids / glossary_ids.
export const POST = async (req, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const formData = await req.formData();
    const result = await importDocumentsService({
      formData,
      projectId: id,
      actorUser,
    });
    return NextResponse.json({ status: "success", ...result }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Failed to import documents");
  }
};
