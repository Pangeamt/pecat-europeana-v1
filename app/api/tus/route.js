"use server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  listTusByProjectService,
  updateTuSchema,
  updateTuStatusService,
} from "@/modules/tus";

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
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await updateTuSchema.validateAsync(body);
    const { tu, alsoUpdated } = await updateTuStatusService(payload, actorUser);
    return Response.json({ tu, alsoUpdated }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
};
