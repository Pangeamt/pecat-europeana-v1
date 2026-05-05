import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  deleteTranslationMemoryService,
  getTranslationMemoryService,
} from "@/modules/memory/tm";

export const DELETE = async (_, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const result = await deleteTranslationMemoryService(id, actorUser);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const GET = async (_, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const result = await getTranslationMemoryService(id, actorUser);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};
