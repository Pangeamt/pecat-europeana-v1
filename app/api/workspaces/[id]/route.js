import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  deleteWorkspaceService,
  getWorkspaceByIdService,
  updateWorkspaceSchema,
  updateWorkspaceService,
} from "@/modules/workspaces";

export const GET = async (_, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const workspace = await getWorkspaceByIdService(id, actorUser);
    return NextResponse.json({ workspace }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to get workspace");
  }
};

export const PATCH = async (req, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await updateWorkspaceSchema.validateAsync(body);
    const workspace = await updateWorkspaceService(id, payload, actorUser);
    return NextResponse.json({ workspace }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to update workspace");
  }
};

export const DELETE = async (_, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    await deleteWorkspaceService(id, actorUser);
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to delete workspace");
  }
};
