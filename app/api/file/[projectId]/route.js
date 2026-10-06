import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  documentShareParamsSchema,
  generateProjectShareUuidService,
} from "@/modules/extraction";

export const GET = async (req, { params }) => {
  try {
    const actorUser = await requireAuthUser();

    const { projectId } = await documentShareParamsSchema.validateAsync(
      await params,
    );
    // ?partial=1: an admin's partial delivery (the service checks the role).
    const partial = new URL(req.url).searchParams.get("partial") === "1";
    const uuid = await generateProjectShareUuidService(projectId, actorUser, {
      partial,
    });
    return Response.json({ uuid }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
};
