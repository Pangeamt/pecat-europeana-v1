import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import {
  addMemberToWorkspaceService,
  assignMemberSchema,
  removeMemberFromWorkspaceService,
} from "@/modules/workspaces";

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
