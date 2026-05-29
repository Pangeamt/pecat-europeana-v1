import prisma from "../../../lib/prisma";

const activeFilter = { deletedAt: null };

export async function createGlossaryRecord(data) {
  return prisma.glossary.create({
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      workspace: { select: { id: true, name: true } },
    },
  });
}

export async function findGlossaryRecordById(id) {
  return prisma.glossary.findFirst({
    where: { id, ...activeFilter },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      workspace: { select: { id: true, name: true } },
    },
  });
}

export async function listGlossaryRecords({
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
    prisma.glossary.findMany({
      where,
      take: parsedSize,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        workspace: { select: { id: true, name: true } },
      },
    }),
    prisma.glossary.count({ where }),
  ]);

  return { docs, total };
}

export async function updateGlossaryRecord(id, data) {
  return prisma.glossary.update({ where: { id }, data });
}

export async function softDeleteGlossaryRecord(id) {
  return prisma.glossary.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function hardDeleteGlossaryRecord(id) {
  return prisma.glossary.delete({ where: { id } });
}
