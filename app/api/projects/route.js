import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  deleteProjectSchema,
  importByUrlSchema,
  importProjectFromUrlService,
  importProjectsFromUploadService,
  listProjectsService,
  softDeleteProjectService,
  updateProjectLabelService,
  updateProjectSchema,
} from "@/modules/projects";

export const GET = async () => {
  try {
    const actorUser = await requireAuthUser();
    const result = await listProjectsService(actorUser);
    return Response.json(result);
  } catch (error) {
    console.error("GET /api/projects failed:", error);
    return toErrorResponse(error);
  }
};

export const PUT = async (req) => {
  try {
    const body = await req.json();
    const { url } = await importByUrlSchema.validateAsync(body);

    const user = await requireAuthUser();
    await importProjectFromUrlService(url, user.id, user.workspaceId);
    return Response.json({ status: "success" });
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const PATCH = async (req) => {
  try {
    const body = await req.json();
    const { label, projectId } = await updateProjectSchema.validateAsync(body);
    await requireAuthUser();
    await updateProjectLabelService(projectId, label);

    return Response.json({ status: "success" });
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const DELETE = async (req) => {
  try {
    const body = await req.json();
    const { projectId } = await deleteProjectSchema.validateAsync(body);
    await requireAuthUser();
    await softDeleteProjectService(projectId);

    return Response.json({ status: "success" });
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const POST = async (req) => {
  try {
    const user = await requireAuthUser();
    const formData = await req.formData();
    await importProjectsFromUploadService({
      formData,
      userId: user.id,
      workspaceId: user.workspaceId,
    });
    return Response.json({ status: "success" });
  } catch (error) {
    return toErrorResponse(error);
  }
};
