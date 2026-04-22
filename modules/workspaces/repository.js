import prisma from "../../lib/prisma";

const workspaceInclude = {
  _count: {
    select: {
      members: true,
      projects: true,
      tms: true,
    },
  },
};

export async function findAllWorkspaces() {
  return prisma.workspace.findMany({
    orderBy: { createdAt: "desc" },
    include: workspaceInclude,
  });
}

export async function findWorkspaceById(id) {
  return prisma.workspace.findUnique({
    where: { id },
    include: {
      ...workspaceInclude,
      members: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
}

export async function findWorkspaceByIdBasic(id) {
  return prisma.workspace.findUnique({ where: { id } });
}

export async function createWorkspace(data) {
  return prisma.workspace.create({
    data,
    include: workspaceInclude,
  });
}

export async function updateWorkspace(id, data) {
  return prisma.workspace.update({
    where: { id },
    data,
    include: workspaceInclude,
  });
}

export async function deleteWorkspace(id) {
  return prisma.workspace.delete({ where: { id } });
}

export async function setUserWorkspace(userId, workspaceId) {
  return prisma.user.update({
    where: { id: userId },
    data: { workspaceId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      workspaceId: true,
    },
  });
}
