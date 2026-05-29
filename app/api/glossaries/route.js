import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  createGlossarySchema,
  createGlossaryService,
  listGlossaryQuerySchema,
  listGlossariesService,
  updateGlossarySchema,
  updateGlossaryService,
} from "@/modules/memory/glossary";

export const GET = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const { searchParams } = new URL(req.url);
    const query = await listGlossaryQuerySchema.validateAsync({
      name: searchParams.get("name"),
      user: searchParams.get("user"),
      project: searchParams.get("project"),
      domain: searchParams.get("domain"),
      source: searchParams.get("source"),
      target: searchParams.get("target"),
      workspaceId: searchParams.get("workspaceId"),
      size: searchParams.get("size"),
    });

    const data = await listGlossariesService(query, actorUser);
    return Response.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const POST = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await createGlossarySchema.validateAsync(body);
    const result = await createGlossaryService(payload, actorUser);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const PATCH = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await updateGlossarySchema.validateAsync(body);
    const result = await updateGlossaryService(payload, actorUser);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};
