import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  listAllTranslationUnitsService,
  tuAllQuerySchema,
} from "@/modules/memory/tu";

export const GET = async (req) => {
  try {
    await requireAuthUser();
    const { searchParams } = new URL(req.url);
    const query = await tuAllQuerySchema.validateAsync({
      translation_memory_id: searchParams.get("translation_memory_id"),
    });
    const data = await listAllTranslationUnitsService(
      query.translation_memory_id,
    );
    return Response.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
};
