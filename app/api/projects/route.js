import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  createProjectSchema,
  createProjectService,
  listProjectsService,
} from "@/modules/projects";

export const GET = async () => {
  try {
    const actorUser = await requireAuthUser();
    const result = await listProjectsService(actorUser);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to get projects");
  }
};

export const POST = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await createProjectSchema.validateAsync(body);
    const project = await createProjectService(payload, actorUser);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Failed to create project");
  }
};
