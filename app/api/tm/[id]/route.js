import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { deleteTranslationMemoryService } from "@/modules/memory/tm";

export const DELETE = async (_, { params }) => {
  try {
    await requireAuthUser();
    const result = await deleteTranslationMemoryService(params.id);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};
