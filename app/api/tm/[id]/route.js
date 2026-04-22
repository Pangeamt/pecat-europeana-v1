import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { deleteTranslationMemoryService } from "@/modules/memory/tm";

export const DELETE = async (_, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const result = await deleteTranslationMemoryService(id, actorUser);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};
