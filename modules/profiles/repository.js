import prisma from "../../lib/prisma";

const profileInclude = {
  createdBy: {
    select: { id: true, name: true, email: true },
  },
  profileTms: {
    where: { tm: { deletedAt: null } },
    include: {
      tm: {
        select: {
          id: true,
          name: true,
          domain: true,
          sourceLanguage: true,
          targetLanguage: true,
        },
      },
    },
  },
  profileGlossaries: {
    where: { glossary: { deletedAt: null } },
    include: {
      glossary: {
        select: {
          id: true,
          name: true,
          domain: true,
          sourceLanguage: true,
          targetLanguage: true,
        },
      },
    },
  },
};

export async function findProfiles(where = {}) {
  return prisma.profile.findMany({
    where: { ...where, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: profileInclude,
  });
}

export async function findProfileById(id) {
  return prisma.profile.findFirst({
    where: { id, deletedAt: null },
    include: profileInclude,
  });
}

export async function findProfileByIdBasic(id) {
  return prisma.profile.findFirst({ where: { id, deletedAt: null } });
}

export async function createProfile(data, tmIds = [], glossaryIds = []) {
  return prisma.profile.create({
    data: {
      ...data,
      profileTms: {
        create: tmIds.map((tmId) => ({ tmId })),
      },
      profileGlossaries: {
        create: glossaryIds.map((glossaryId) => ({ glossaryId })),
      },
    },
    include: profileInclude,
  });
}

export async function updateProfile(id, data, tmIds, glossaryIds) {
  return prisma.profile.update({
    where: { id },
    data: {
      ...data,
      ...(tmIds !== undefined
        ? {
            profileTms: {
              deleteMany: {},
              create: tmIds.map((tmId) => ({ tmId })),
            },
          }
        : {}),
      ...(glossaryIds !== undefined
        ? {
            profileGlossaries: {
              deleteMany: {},
              create: glossaryIds.map((glossaryId) => ({ glossaryId })),
            },
          }
        : {}),
    },
    include: profileInclude,
  });
}

export async function softDeleteProfileRecord(id) {
  return prisma.profile.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function findValidTmIdsInWorkspace(tmIds, workspaceId) {
  if (!tmIds?.length) return [];
  const rows = await prisma.tm.findMany({
    where: { id: { in: tmIds }, workspaceId, deletedAt: null },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

export async function findValidGlossaryIdsInWorkspace(glossaryIds, workspaceId) {
  if (!glossaryIds?.length) return [];
  const rows = await prisma.glossary.findMany({
    where: { id: { in: glossaryIds }, workspaceId, deletedAt: null },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}
