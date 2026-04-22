import prisma from "../../lib/prisma";

export async function findAllUsers(where = {}) {
  return prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      provider: true,
      emailVerified: true,
      workspaceId: true,
    },
  });
}

export async function findUserById(id) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function createUser(data) {
  return prisma.user.create({
    data,
  });
}

export async function updateUserById(id, data) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

export async function deleteUserById(id) {
  return prisma.user.delete({ where: { id } });
}

