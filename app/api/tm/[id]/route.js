import { requireAuthUser } from "@/modules/shared/auth";
import { toErrorResponse } from "@/modules/shared/http";
import { deleteTranslationMemoryService } from "@/modules/tm/service";

export const DELETE = async (_, { params }) => {
  try {
    await requireAuthUser();
    const result = await deleteTranslationMemoryService(params.id);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};
