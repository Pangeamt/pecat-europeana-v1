import { requireAuthUser } from "@/modules/shared/auth";
import { toErrorResponse } from "@/modules/shared/http";
import {
  createTranslationMemoryService,
  listTranslationMemoriesService,
  updateTranslationMemoryService,
} from "@/modules/tm/service";
import {
  createTmSchema,
  listTmQuerySchema,
  updateTmSchema,
} from "@/modules/tm/schemas";

export const GET = async (req) => {
  try {
    await requireAuthUser();
    const { searchParams } = new URL(req.url);
    const query = await listTmQuerySchema.validateAsync({
      name: searchParams.get("name"),
      user: searchParams.get("user"),
      project: searchParams.get("project"),
      domain: searchParams.get("domain"),
      source: searchParams.get("source"),
      target: searchParams.get("target"),
      size: searchParams.get("size"),
    });

    const data = await listTranslationMemoriesService(query);
    return Response.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const POST = async (req) => {
  try {
    await requireAuthUser();
    const body = await req.json();
    const payload = await createTmSchema.validateAsync(body);
    const result = await createTranslationMemoryService(payload);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const PATCH = async (req) => {
  try {
    await requireAuthUser();
    const body = await req.json();
    const payload = await updateTmSchema.validateAsync(body);
    const result = await updateTranslationMemoryService(payload);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};
