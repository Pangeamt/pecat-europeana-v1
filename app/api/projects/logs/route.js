import { getServerSession } from "next-auth";
import prisma from "../../../../lib/prisma";
import { authOptions } from "../../../../lib/auth";
import axios from "axios";
const levenshtein = require("fast-levenshtein");

const levenshteinSimilarity = (s1, s2) => {
  let distance = levenshtein.get(s1.toLowerCase(), s2.toLowerCase());
  let maxLength = Math.max(s1.length, s2.length);
  return (maxLength - distance) / maxLength;
};

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
    const tmId = searchParams.get("tmId");

    const where = {
      id: projectId ?? undefined,
      userId: user.id,
      deletedAt: null,
    };

    if (user.role === "ADMIN") {
      delete where.userId;
    }

    // get projectId
    const project = await prisma.project.findUnique({
      where,
    });
    if (project === null) {
      return Response.json({ message: "Project not found" }, { status: 404 });
    }

    // get all tus from projectId
    const tus = await prisma.tu.findMany({
      where: {
        projectId: project.id,
      },
    });

    // get axios http://localhost:3005/api-tm/tu/all?translation_memory_id=Z_Oq4o8Bko-oJCmvCOA0
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_TM_HOST}/tu/all?translation_memory_id=${tmId}`
    );

    const docs = response.data.docs;

    const stats = {
      noMatch: 0,
      "50To74": 0,
      "75To84": 0,
      "85To94": 0,
      "95To99": 0,
      100: 0,
    };

    for (let i = 0; i < tus.length; i++) {
      const tuElement = tus[i];
      let maxSimilarity = 0;
      for (let j = 0; j < docs.length; j++) {
        const tuTM = docs[j];
        const similarity = levenshteinSimilarity(
          tuElement.srcLiteral,
          tuTM.text
        );
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
        }
      }
      if (maxSimilarity >= 0.5 && maxSimilarity < 0.75) {
        stats["50To74"] =
          stats["50To74"] + tuElement.srcLiteral.split(" ").length;
      } else if (maxSimilarity >= 0.75 && maxSimilarity < 0.85) {
        stats["75To84"] =
          stats["75To84"] + tuElement.srcLiteral.split(" ").length;
      } else if (maxSimilarity >= 0.85 && maxSimilarity < 0.94) {
        stats["85To94"] =
          stats["85To94"] + tuElement.srcLiteral.split(" ").length;
      } else if (maxSimilarity >= 0.95 && maxSimilarity < 1) {
        stats["95To99"] =
          stats["95To99"] + tuElement.srcLiteral.split(" ").length;
      } else if (maxSimilarity === 1) {
        stats["100"] = stats["100"] + tuElement.srcLiteral.split(" ").length;
      } else {
        stats["noMatch"] =
          stats["noMatch"] + tuElement.srcLiteral.split(" ").length;
      }
    }

    return Response.json({
      projectId,
      tmId,
      stats,
    });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
};
