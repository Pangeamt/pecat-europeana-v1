import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { listTuRevisionsService } from "@/modules/tus";

// Edit history of one segment (the editor's status popover).
export const GET = async (_req, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const result = await listTuRevisionsService(id, actorUser);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};
