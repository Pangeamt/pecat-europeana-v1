import { requireAuthUser } from "../../../modules/shared/auth";
import { toErrorResponse } from "../../../modules/shared/http";
import {
  deleteProjectSchema,
  importByUrlSchema,
  updateProjectSchema,
} from "../../../modules/projects/schemas";
import {
  listProjectsService,
  softDeleteProjectService,
  updateProjectLabelService,
} from "../../../modules/projects/service";
import {
  importProjectFromUrlService,
  importProjectsFromUploadService,
} from "../../../modules/projects/import-service";

const schemaPUT = importByUrlSchema;

export const GET = async () => {
  try {
    const actorUser = await requireAuthUser();
    const result = await listProjectsService(actorUser);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const PUT = async (req) => {
  try {
    const body = await req.json();
    const value = await schemaPUT.validateAsync(body);
    const { url } = value;

    const user = await requireAuthUser();
    await importProjectFromUrlService(url, user.id);
    return Response.json({ status: "success" });
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const PATCH = async (req) => {
  try {
    const body = await req.json();
    const value = await updateProjectSchema.validateAsync(body);
    const { label, projectId } = value;
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
    const value = await deleteProjectSchema.validateAsync(body);
    const { projectId } = value;
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
    await importProjectsFromUploadService({ formData, userId: user.id });
    return Response.json({ status: "success" });
  } catch (error) {
    return toErrorResponse(error);
  }
};
