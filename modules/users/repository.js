import prisma from "@/lib/prisma";

const activeFilter = { deletedAt: null };

export async function findAllUsers(where = {}) {
  return prisma.user.findMany({
    where: { ...activeFilter, ...where },
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
  return prisma.user.findFirst({
    where: { id, ...activeFilter },
    include: {
      workspace: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function findUserByEmail(email) {
  return prisma.user.findFirst({
    where: { email, ...activeFilter },
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

export async function softDeleteUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true, deletedAt: true },
  });

  if (!user || user.deletedAt) return user;

  // Anonymize the email so the unique constraint does not block future
  // sign-ups with the same address.
  const anonymizedEmail = `deleted_${Date.now()}_${user.email}`.slice(0, 191);

  return prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      email: anonymizedEmail,
    },
  });
}
