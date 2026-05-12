import prisma from "../../lib/prisma";

export async function findProjects(where) {
  return prisma.project.findMany({
    where,
    select: {
      id: true,
      filename: true,
      status: true,
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
      workspace: {
        select: {
          id: true,
          name: true,
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

export function buildProjectScopeWhere(actorUser, extra = {}) {
  const role = String(actorUser?.role || "").toUpperCase();

  if (role === "SUPER") {
    return { ...extra };
  }

  const where = { deletedAt: null, ...extra };

  if (actorUser.workspaceId) {
    where.workspaceId = actorUser.workspaceId;
  } else {
    where.workspaceId = "__no_workspace__";
  }

  if (role === "USER") {
    where.userId = actorUser.id;
  }

  return where;
}

export async function findProjectForActor(projectId, actorUser) {
  if (!projectId) return null;
  const where = buildProjectScopeWhere(actorUser, { id: projectId });
  return prisma.project.findFirst({ where });
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

