import prisma from "../../lib/prisma";

export async function findProjectForTus(projectId, actorUser) {
  const where = {
    id: projectId,
    userId: actorUser.id,
  };

  if (actorUser.role === "ADMIN") {
    delete where.userId;
  }

  return prisma.project.findFirst({ where });
}

export async function findTusByProjectId(projectId) {
  return prisma.tu.findMany({
    where: { projectId },
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

