import { NextResponse } from "next/server";
import { requireAuthUser } from "../../../../modules/shared/auth";
import { toErrorResponse } from "../../../../modules/shared/http";
import { getUserByIdService } from "../../../../modules/users/service";

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
