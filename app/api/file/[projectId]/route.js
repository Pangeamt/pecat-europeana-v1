import { requireAuthUser } from "../../../../modules/shared/auth";
import { toErrorResponse } from "../../../../modules/shared/http";
import { fileShareParamsSchema } from "../../../../modules/files/schemas";
import { generateProjectShareUuidService } from "../../../../modules/files/service";

export const GET = async (req, { params }) => {
  try {
    await requireAuthUser();

    const { projectId } = await fileShareParamsSchema.validateAsync(await params);
    const uuid = await generateProjectShareUuidService(projectId);
    return Response.json({ uuid }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
};
