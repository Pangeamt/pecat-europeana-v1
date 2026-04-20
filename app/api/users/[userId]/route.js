import { NextResponse } from "next/server";
import { requireAuthUser, toErrorResponse } from "@/modules/shared";
import { getUserByIdService } from "@/modules/users/service";

export const GET = async (_, { params }) => {
  try {
    const { userId } = await params;
    const actorUser = await requireAuthUser();
    const docUser = await getUserByIdService(userId, actorUser.id);
    return NextResponse.json({ user: docUser }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
};
