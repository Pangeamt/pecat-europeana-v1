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

// Rows (id + status) so the service can tell "does not exist in the
// workspace" apart from "exists but its DAAIT build is not SUCCESS yet".
export async function findTmAssetsInWorkspace(tmIds, workspaceId) {
  if (!tmIds?.length) return [];
  return prisma.tm.findMany({
    where: { id: { in: tmIds }, workspaceId, deletedAt: null },
    select: { id: true, status: true },
  });
}

export async function findGlossaryAssetsInWorkspace(glossaryIds, workspaceId) {
  if (!glossaryIds?.length) return [];
  return prisma.glossary.findMany({
    where: { id: { in: glossaryIds }, workspaceId, deletedAt: null },
    select: { id: true, status: true },
  });
}
