import { getServerSession } from "next-auth";
import prisma from "../../../../lib/prisma";
import { authOptions } from "../../../../lib/auth";
import { uid } from "uid";

export const GET = async (req, { params }) => {
  try {
    const authValue = await getServerSession(authOptions);
    if (!authValue)
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    const { user } = authValue;
    if (!user)
      return Response.json({ message: "Unauthorized" }, { status: 401 });

    const projectId = params.projectId;

    const project = await prisma.project.findUnique({
      where: {
        id: projectId ?? undefined,
      },
    });

    if (!project)
      return Response.json({ message: "Project not found" }, { status: 404 });

    const uuid = uid();

    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        uuid,
        accessDeadline: new Date(
          new Date().getTime() + 7 * 24 * 60 * 60 * 1000
        ),
      },
    });

    return Response.json({ uuid }, { status: 200 });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
};
