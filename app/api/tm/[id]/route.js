import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { deleteTranslationMemoryService } from "@/modules/memory/tm";

export const DELETE = async (_, { params }) => {
  try {
    const actorUser = await requireAuthUser();
    const result = await deleteTranslationMemoryService(params.id, actorUser);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};
