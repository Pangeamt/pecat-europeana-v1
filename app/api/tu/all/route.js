import { requireAuthUser } from "@/modules/shared/auth";
import { toErrorResponse } from "@/modules/shared/http";
import { tuAllQuerySchema } from "@/modules/tu/schemas";
import { listAllTranslationUnitsService } from "@/modules/tu/service";

export const GET = async (req) => {
  try {
    await requireAuthUser();
    const { searchParams } = new URL(req.url);
    const query = await tuAllQuerySchema.validateAsync({
      translation_memory_id: searchParams.get("translation_memory_id"),
    });
    const data = await listAllTranslationUnitsService(query.translation_memory_id);
    return Response.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
};
