import contentDisposition from "content-disposition";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { readOriginalDocumentService } from "@/modules/documents/export-service";

// The document exactly as it was uploaded. Always available to whoever can
// see the document, whatever the state of its segments.
export const GET = async (_req, { params }) => {
  try {
    const actorUser = await requireAuthUser();
    const { id } = await params;
    const { body, filename } = await readOriginalDocumentService(id, actorUser);
    return new Response(body, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": contentDisposition(filename),
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
};
