import { requireAuthUser } from "@/modules/shared/auth";
import { toErrorResponse } from "@/modules/shared/http";
import {
  createTuSchema,
  tuSearchQuerySchema,
  updateTuSchema,
} from "@/modules/tu/schemas";
import {
  createTranslationUnitService,
  searchTranslationUnitsService,
  updateTranslationUnitService,
} from "@/modules/tu/service";

export const GET = async (req) => {
  try {
    await requireAuthUser();
    const { searchParams } = new URL(req.url);
    const query = await tuSearchQuerySchema.validateAsync({
      translation_memory_id: searchParams.get("translation_memory_id"),
      source_language: searchParams.get("source_language"),
      target_language: searchParams.get("target_language"),
      source_text: searchParams.get("source_text"),
      user: searchParams.get("user"),
      project: searchParams.get("project"),
      domain: searchParams.get("domain"),
      perTerm: searchParams.get("perTerm"),
    });
    const data = await searchTranslationUnitsService(query);
    return Response.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const POST = async (req) => {
  try {
    await requireAuthUser();
    const body = await req.json();
    const payload = await createTuSchema.validateAsync(body);
    const result = await createTranslationUnitService(payload);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const PATCH = async (req) => {
  try {
    await requireAuthUser();
    const body = await req.json();
    const payload = await updateTuSchema.validateAsync(body);
    const result = await updateTranslationUnitService(payload);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};
