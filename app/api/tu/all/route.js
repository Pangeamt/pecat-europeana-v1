import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  listTranslationUnitsPageService,
  tuAllQuerySchema,
} from "@/modules/memory/tu";

export const GET = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const { searchParams } = new URL(req.url);
    const query = await tuAllQuerySchema.validateAsync({
      translation_memory_id: searchParams.get("translation_memory_id"),
      page: searchParams.get("page"),
      size: searchParams.get("size"),
    });
    const data = await listTranslationUnitsPageService(
      query.translation_memory_id,
      actorUser,
      { page: query.page, size: query.size },
    );
    return Response.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
};
