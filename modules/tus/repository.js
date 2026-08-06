import prisma from "../../lib/prisma";
import { buildProjectScopeWhere } from "../projects/repository";

export async function findProjectForTus(projectId, actorUser) {
  if (!projectId) return null;
  const where = buildProjectScopeWhere(actorUser, { id: projectId });
  return prisma.project.findFirst({ where });
}

// Review UI listing: hidden segments (visibility rules) are not shown. The
// export/merge paths use their own unfiltered queries on purpose.
export async function findTusByProjectId(projectId) {
  return prisma.tu.findMany({
    where: { projectId, visible: true },
  });
}

export async function findTuById(id) {
  return prisma.tu.findUnique({
    where: { id },
  });
}

export async function findTusWithSameSource(projectId, srcLiteral, excludedTuId) {
  return prisma.tu.findMany({
    where: {
      srcLiteral,
      projectId,
      id: {
        not: excludedTuId,
      },
    },
  });
}

export async function updateTuById(id, data) {
  return prisma.tu.update({
    where: { id },
    data,
  });
}

