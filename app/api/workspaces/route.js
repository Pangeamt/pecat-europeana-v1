import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  createWorkspaceSchema,
  createWorkspaceService,
  listWorkspacesService,
} from "@/modules/workspaces";

export const GET = async () => {
  try {
    const actorUser = await requireAuthUser();
    const workspaces = await listWorkspacesService(actorUser);
    return NextResponse.json({ workspaces }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to get workspaces");
  }
};

export const POST = async (req) => {
  try {
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await createWorkspaceSchema.validateAsync(body);
    const workspace = await createWorkspaceService(payload, actorUser);
    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Failed to create workspace");
  }
};
