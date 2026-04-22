import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { fileShareParamsSchema } from "@/modules/files/schemas";
import { generateProjectShareUuidService } from "@/modules/files/service";

export const GET = async (req, { params }) => {
  try {
    const actorUser = await requireAuthUser();

    const { projectId } = await fileShareParamsSchema.validateAsync(
      await params,
    );
    const uuid = await generateProjectShareUuidService(projectId, actorUser);
    return Response.json({ uuid }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
};
