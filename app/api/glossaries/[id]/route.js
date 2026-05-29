import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  deleteGlossaryService,
  getGlossaryService,
} from "@/modules/memory/glossary";

export const DELETE = async (_, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const result = await deleteGlossaryService(id, actorUser);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const GET = async (_, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const result = await getGlossaryService(id, actorUser);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};
