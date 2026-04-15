import { requireAuthUser } from "../../../modules/shared/auth";
import { toErrorResponse } from "../../../modules/shared/http";
import { updateTuSchema } from "../../../modules/tus/schemas";
import { listTusByProjectService, updateTuStatusService } from "../../../modules/tus/service";

export const GET = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.searchParams);
    const projectId = searchParams.get("projectId");
    const result = await listTusByProjectService(projectId, actorUser);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const POST = async (req) => {
  try {
    await requireAuthUser();
    const body = await req.json();
    const payload = await updateTuSchema.validateAsync(body);
    const tuUpdated = await updateTuStatusService(payload);
    return Response.json({ tu: tuUpdated }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
};
