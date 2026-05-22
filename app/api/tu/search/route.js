import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  searchTranslationUnitsByQueryService,
  tuSearchQuerySchema,
} from "@/modules/memory/tu";

export const GET = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const { searchParams } = new URL(req.url);
    const query = await tuSearchQuerySchema.validateAsync({
      translation_memory_id: searchParams.get("translation_memory_id"),
      q: searchParams.get("query") ?? "",
    });
    const data = await searchTranslationUnitsByQueryService(query, actorUser);
    return Response.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
};
