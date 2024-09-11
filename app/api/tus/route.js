import { getServerSession } from "next-auth";
import Joi from "joi";

import prisma from "../../../lib/prisma";
import { authOptions } from "../../../lib/auth";

const schemaPOST = Joi.object({
  tuId: Joi.string().required(),
  reviewLiteral: Joi.string().allow(null).optional(),
  action: Joi.string().required(),
});

export const GET = async (req) => {
  try {
    const authValue = await getServerSession(authOptions);
    if (!authValue)
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    const { user } = authValue;
    if (!user)
      return Response.json({ message: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.searchParams);
    const projectId = searchParams.get("projectId");
    if (!projectId)
      return Response.json(
        { message: "projectId is required" },
        { status: 400 }
      );

    const where = {
      id: projectId,
      userId: user.id,
    };

    if (user.role === "ADMIN") {
      delete where.userId;
    }
    const project = await prisma.project.findFirst({
      where,
    });

    if (!project)
      return Response.json({ message: "Project not found" }, { status: 404 });

    const tus = await prisma.tu.findMany({
      where: {
        projectId,
      },
    });
    return Response.json({
      total: tus.length,
      docs: tus,
    });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 400 });
  }
};

export const POST = async (req) => {
  try {
    const authValue = await getServerSession(authOptions);
    if (!authValue)
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    const { user } = authValue;
    if (!user)
      return Response.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const value = await schemaPOST.validateAsync(body);
    const { tuId, reviewLiteral, action, levenshteinDistance = null } = value;

    const tu = await prisma.tu.findUnique({
      where: {
        id: tuId,
      },
    });

    // find tu whit same srcliteral && diferent tuId
    const tusWithSameSrcLiteral = await prisma.tu.findMany({
      where: {
        srcLiteral: tu.srcLiteral,
        projectId: tu.projectId,
        id: {
          not: tuId,
        },
      },
    });

    const data = {};
    if (action === "approve") {
      let Status = "NOT_REVIEWED";
      if (tu.translatedLiteral === reviewLiteral || !reviewLiteral) {
        Status = "ACCEPTED";
      } else {
        Status = "EDITED";
      }
      data.Status = Status;
      data.reviewLiteral = reviewLiteral;
    } else if (action === "reject") {
      let Status = "REJECTED";
      data.Status = Status;
    }
    if (levenshteinDistance) {
      data.levenshteinDistance = levenshteinDistance;
    }

    const tuUpdated = await prisma.tu.update({
      where: {
        id: tuId,
      },
      data,
    });

    if (tusWithSameSrcLiteral.length > 0) {
      for (const tu of tusWithSameSrcLiteral) {
        await prisma.tu.update({
          where: {
            id: tu.id,
          },
          data,
        });
      }
    }

    return Response.json({ tu: tuUpdated }, { status: 200 });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 401 });
  }
};
