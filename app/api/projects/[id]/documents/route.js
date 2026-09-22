import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { importDocumentsService } from "@/modules/documents";

// Multipart upload of one or more documents into a project: file[], src,
// tgt and mt. Documents always take the project's profile (and its TMs and
// glossaries); a project without one answers 409 PROFILE_REQUIRED.
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
