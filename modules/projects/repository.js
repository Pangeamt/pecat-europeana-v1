import prisma from "../../lib/prisma";

export async function findProjects(where) {
  return prisma.project.findMany({
    where,
    select: {
      id: true,
      filename: true,
      mt: true,
      extension: true,
      createdAt: true,
      deletedAt: true,
      label: true,
      User: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function findProjectById(id) {
  return prisma.project.findUnique({
    where: { id },
  });
}

export async function findProjectForActor(projectId, actorUser) {
  const where = {
    id: projectId ?? undefined,
    userId: actorUser.id,
    deletedAt: null,
  };

  if (actorUser.role === "ADMIN") {
    delete where.userId;
  }

  return prisma.project.findUnique({ where });
}

export async function findTusByProjectId(projectId) {
  return prisma.tu.findMany({
    where: { projectId },
  });
}

export async function getProjectStatusCounts(projectId) {
  const [countByStatus, totalCount] = await Promise.all([
    prisma.tu.groupBy({
      by: ["Status"],
      _count: true,
      where: { projectId },
    }),
    prisma.tu.count({
      where: { projectId },
    }),
  ]);

  return { countByStatus, totalCount };
}

export async function updateProjectById(id, data) {
  return prisma.project.update({
    where: { id },
    data,
  });
}

