import { NextResponse } from "next/server";
import { HttpError, requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  addMemberToWorkspaceService,
  removeMemberFromWorkspaceService,
  getMembersOfWorkspaceService,
} from "@/modules/workspaces";
import { assignMemberSchema } from "@/modules/workspaces/schemas";

export const POST = async (req, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await assignMemberSchema.validateAsync(body);
    const member = await addMemberToWorkspaceService(
      id,
      payload.userId,
      actorUser,
    );
    return NextResponse.json({ member }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to add member");
  }
};

export const DELETE = async (req, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    const body = await req.json();
    const payload = await assignMemberSchema.validateAsync(body);
    const member = await removeMemberFromWorkspaceService(
      id,
      payload.userId,
      actorUser,
    );
    return NextResponse.json({ member }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to remove member");
  }
};

export const GET = async (req, { params }) => {
  try {
    const { id } = await params;
    const actorUser = await requireAuthUser();
    if (!actorUser) throw new HttpError(401, "Unauthorized");

    if (actorUser.role === "USER")
      throw new HttpError(403, "You cannot access this workspace");
    if (actorUser.role === "ADMIN" && actorUser.workspaceId !== id)
      throw new HttpError(403, "You cannot access this workspace");

    const members = await getMembersOfWorkspaceService(id, actorUser);
    return NextResponse.json({ members }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to get members");
  }
};
