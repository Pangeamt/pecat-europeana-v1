import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";

const projectInclude = {
  profile: {
    select: { id: true, name: true },
  },
};

// Projects are workspace-level: every role sees the whole workspace (USER
// scoping applies to the documents inside, not to the project list).
export function buildProjectScopeWhere(actorUser, extra = {}) {
  const role = String(actorUser?.role || "").toUpperCase();

  if (role === "SUPER") {
    return { deletedAt: null, ...extra };
  }

  return {
    deletedAt: null,
    workspaceId: actorUser.workspaceId ?? "__no_workspace__",
    ...extra,
  };
}

export async function createProject(data) {
  return prisma.project.create({ data, include: projectInclude });
}

export async function findProjectForActor(projectId, actorUser) {
  if (!projectId) return null;
  const where = buildProjectScopeWhere(actorUser, { id: projectId });
  return prisma.project.findFirst({ where, include: projectInclude });
}

// Used by the document import: resolves the profile's TMs/glossaries so they
// can be materialized on the new document when it inherits the profile.
export async function findProjectWithProfileForActor(projectId, actorUser) {
  if (!projectId) return null;
  const where = buildProjectScopeWhere(actorUser, { id: projectId });

  return prisma.project.findFirst({
    where,
    include: {
      profile: {
        include: {
          profileTms: {
            where: { tm: { deletedAt: null } },
            select: { tmId: true },
          },
          profileGlossaries: {
            where: { glossary: { deletedAt: null } },
            select: { glossaryId: true },
          },
        },
      },
    },
  });
}

export async function updateProjectById(id, data) {
  return prisma.project.update({
    where: { id },
    data,
    include: projectInclude,
  });
}

export async function countDocumentsInProject(projectId) {
  return prisma.document.count({
    where: { projectId, deletedAt: null },
  });
}

// Single aggregated query for the projects list: document count, visible
// segment count and finished segment count per project. "Finished" means any
// status other than NOT_REVIEWED / TRANSLATED_MT (both pending buckets are
// summed — the old per-document UI only subtracted one of them by mistake).
export async function getProjectsWithStats(actorUser) {
  const role = String(actorUser?.role || "").toUpperCase();
  const workspaceFilter =
    role === "SUPER"
      ? Prisma.empty
      : Prisma.sql`AND cp.workspaceId = ${actorUser.workspaceId ?? "__no_workspace__"}`;
  const documentUserFilter =
    role === "USER" ? Prisma.sql`AND d.userId = ${actorUser.id}` : Prisma.empty;

  const rows = await prisma.$queryRaw`
    SELECT cp.id,
           cp.name,
           cp.description,
           cp.profileId,
           cp.tmThreshold,
           cp.createdAt,
           cp.updatedAt,
           pr.name AS profileName,
           COUNT(DISTINCT d.id) AS docsCount,
           COUNT(t.id) AS segmentsCount,
           COALESCE(SUM(t.Status NOT IN ('NOT_REVIEWED', 'TRANSLATED_MT')), 0) AS finishedCount
    FROM client_projects cp
    LEFT JOIN profiles pr ON pr.id = cp.profileId
    LEFT JOIN projects d
           ON d.clientProjectId = cp.id AND d.deletedAt IS NULL ${documentUserFilter}
    LEFT JOIN tus t ON t.projectId = d.id AND t.visible = 1
    WHERE cp.deletedAt IS NULL ${workspaceFilter}
    GROUP BY cp.id, cp.name, cp.description, cp.profileId, cp.tmThreshold,
             cp.createdAt, cp.updatedAt, pr.name
    ORDER BY cp.createdAt DESC
  `;

  // COUNT() comes back as BigInt and SUM() as Decimal — normalize to numbers.
  return rows.map((row) => ({
    ...row,
    docsCount: Number(row.docsCount),
    segmentsCount: Number(row.segmentsCount),
    finishedCount: Number(row.finishedCount),
  }));
}
