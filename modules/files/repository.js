import prisma from "../../lib/prisma";

export async function findProjectById(id) {
  return prisma.project.findUnique({
    where: { id },
  });
}

export async function updateProjectById(id, data) {
  return prisma.project.update({
    where: { id },
    data,
  });
}

export async function findTusByProjectId(projectId) {
  return prisma.tu.findMany({
    where: { projectId },
  });
}

