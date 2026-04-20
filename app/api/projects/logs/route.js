import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { getProjectLogsStatsService } from "@/modules/projects";

export const GET = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.searchParams);
    const projectId = searchParams.get("projectId");
    const tmId = searchParams.get("tmId");

    const result = await getProjectLogsStatsService({
      projectId,
      tmId,
      actorUser,
    });
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};
