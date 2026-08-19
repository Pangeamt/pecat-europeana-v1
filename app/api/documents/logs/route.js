import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { getDocumentLogsStatsService } from "@/modules/documents";

export const GET = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.searchParams);
    const documentId = searchParams.get("documentId");
    const tmId = searchParams.get("tmId");

    const result = await getDocumentLogsStatsService({
      documentId,
      tmId,
      actorUser,
    });
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};
