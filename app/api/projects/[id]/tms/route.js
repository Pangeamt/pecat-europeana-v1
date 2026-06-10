import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  updateProjectTmsSchema,
  updateProjectTmsService,
} from "@/modules/projects";

export const PATCH = async (req, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const { updateTmIds } = await updateProjectTmsSchema.validateAsync(body);

    const result = await updateProjectTmsService(id, updateTmIds, actorUser);
    return Response.json(result);
  } catch (error) {
    console.error("PATCH /api/projects/[id]/tms failed:", error);
    return toErrorResponse(error);
  }
};
