import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  createTranslationUnitService,
  createTuSchema,
  deleteTranslationUnitService,
  deleteTuSchema,
  searchTranslationUnitsService,
  tuGetAllQuerySchema,
  updateTranslationUnitService,
  updateTuSchema,
} from "@/modules/memory/tu";

export const GET = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const { searchParams } = new URL(req.url);
    const query = await tuGetAllQuerySchema.validateAsync({
      translation_memory_id: searchParams.get("translation_memory_id"),
      source_language: searchParams.get("source_language"),
      target_language: searchParams.get("target_language"),
      source_text: searchParams.get("source_text"),
      user: searchParams.get("user"),
      project: searchParams.get("project"),
      domain: searchParams.get("domain"),
      perTerm: searchParams.get("perTerm"),
      minSimilarity: searchParams.get("minSimilarity") ?? undefined,
    });
    const data = await searchTranslationUnitsService(query, actorUser);
    return Response.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const POST = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await createTuSchema.validateAsync(body);
    const result = await createTranslationUnitService(payload, actorUser);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const PATCH = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await updateTuSchema.validateAsync(body);
    const result = await updateTranslationUnitService(payload, actorUser);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const DELETE = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await deleteTuSchema.validateAsync(body);
    const result = await deleteTranslationUnitService(payload, actorUser);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};
