import prisma from "../../../lib/prisma";
import { MEMORY_ASSET_FINAL_STATUSES } from "../status";

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
  status,
  size = 100,
}) {
  const where = { ...activeFilter };
  if (workspaceId) where.workspaceId = workspaceId;
  if (createdByUserId) where.createdByUserId = createdByUserId;
  if (name) where.name = { contains: name };
  if (domain) where.domain = { contains: domain };
  if (source) where.sourceLanguage = source;
  if (target) where.targetLanguage = target;
  if (status) where.status = status;

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

export async function updateGlossaryStatusRecord(id, status) {
  return prisma.glossary.update({ where: { id }, data: { status } });
}

// Glossaries the status worker still has to poll in DAAIT (not SUCCESS/FAILED yet).
export async function listPendingStatusGlossaryRecords(limit = 50) {
  return prisma.glossary.findMany({
    where: { ...activeFilter, status: { notIn: MEMORY_ASSET_FINAL_STATUSES } },
    select: { id: true, status: true },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });
}
