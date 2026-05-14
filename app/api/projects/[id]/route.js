import { getProjectByIdService } from "@/modules/projects";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";

export const GET = async (_, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const project = await getProjectByIdService(id, actorUser);
    return Response.json(project);
  } catch (error) {
    console.error("GET /api/projects/[id] failed:", error);
    return toErrorResponse(error);
  }
};
