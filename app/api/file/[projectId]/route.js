import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  documentShareParamsSchema,
  generateProjectShareUuidService,
} from "@/modules/documents";

export const GET = async (req, { params }) => {
  try {
    const actorUser = await requireAuthUser();

    const { projectId } = await documentShareParamsSchema.validateAsync(
      await params,
    );
    const uuid = await generateProjectShareUuidService(projectId, actorUser);
    return Response.json({ uuid }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
};
