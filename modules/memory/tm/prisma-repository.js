import prisma from "../../../lib/prisma";

const activeFilter = { deletedAt: null };

export async function createTmRecord(data) {
  return prisma.tm.create({
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      workspace: { select: { id: true, name: true } },
    },
  });
}

export async function findTmRecordById(id) {
  return prisma.tm.findFirst({
    where: { id, ...activeFilter },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      workspace: { select: { id: true, name: true } },
    },
  });
}

export async function listTmRecords({
  workspaceId,
  name,
  domain,
  source,
  target,
  createdByUserId,
  size = 100,
}) {
  const where = { ...activeFilter };
  if (workspaceId) where.workspaceId = workspaceId;
  if (createdByUserId) where.createdByUserId = createdByUserId;
  if (name) where.name = { contains: name };
  if (domain) where.domain = { contains: domain };
  if (source) where.sourceLanguage = source;
  if (target) where.targetLanguage = target;

  const parsedSize = Number.parseInt(size, 10) || 100;

  const [docs, total] = await Promise.all([
    prisma.tm.findMany({
      where,
      take: parsedSize,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        workspace: { select: { id: true, name: true } },
      },
    }),
    prisma.tm.count({ where }),
  ]);

  return { docs, total };
}

export async function updateTmRecord(id, data) {
  return prisma.tm.update({ where: { id }, data });
}

export async function softDeleteTmRecord(id) {
  return prisma.tm.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// Permanent delete. Use only for rollback right after a failed create;
// regular delete flows should go through softDeleteTmRecord.
export async function hardDeleteTmRecord(id) {
  return prisma.tm.delete({ where: { id } });
}
