import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import prisma from "../../../../lib/prisma";
import { authOptions } from "../../../../lib/auth";

export const GET = async (_, { params }) => {
  try {
    const authValue = await getServerSession(authOptions);

    const userId = params.userId;

    if (!authValue)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const { user } = authValue;
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const docUser = await prisma.user.findUnique({
      where: {
        id: userId || user.id,
      },
    });
    if (!docUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    if (docUser.image) {
      docUser.image = docUser.image?.toString("utf-8");
    }

    return NextResponse.json({ user: docUser }, { status: 200 });
  } catch (error) {
    return NextResponse.error({ message: error.message }, { status: 401 });
  }
};
