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

export async function findProjectWithTmsForActor(projectId, actorUser) {
  if (!projectId) return null;
  const where = buildProjectScopeWhere(actorUser, { id: projectId });

  return prisma.project.findFirst({
    where,
    include: {
      projectTms: {
        select: {
          tmId: true,
          updateTm: true,
          tm: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      projectGlossaries: {
        select: {
          glossaryId: true,
          glossary: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function findValidTmIdsInWorkspace(tmIds, workspaceId) {
  if (!Array.isArray(tmIds) || tmIds.length === 0) return [];
  if (!workspaceId) return [];

  const rows = await prisma.tm.findMany({
    where: {
      id: { in: tmIds },
      workspaceId,
      deletedAt: null,
    },
    select: { id: true },
  });

  return rows.map((row) => row.id);
}

export async function findValidGlossaryIdsInWorkspace(glossaryIds, workspaceId) {
  if (!Array.isArray(glossaryIds) || glossaryIds.length === 0) return [];
  if (!workspaceId) return [];

  const rows = await prisma.glossary.findMany({
    where: {
      id: { in: glossaryIds },
      workspaceId,
      deletedAt: null,
    },
    select: { id: true },
  });

  return rows.map((row) => row.id);
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

export async function setProjectTmUpdateFlags(projectId, updateTmIds) {
  const ids = Array.isArray(updateTmIds) ? updateTmIds : [];

  await prisma.$transaction([
    prisma.projectTm.updateMany({
      where: { projectId },
      data: { updateTm: false },
    }),
    ...(ids.length > 0
      ? [
          prisma.projectTm.updateMany({
            where: { projectId, tmId: { in: ids } },
            data: { updateTm: true },
          }),
        ]
      : []),
  ]);
}

