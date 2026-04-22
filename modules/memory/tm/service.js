import { HttpError } from "@/modules/shared/http-error";
import {
  createTmWithId,
  deleteTm,
  searchTusByMemoryId,
  updateTm,
} from "./repository";
import {
  createTmRecord,
  deleteTmRecord,
  findTmRecordById,
  listTmRecords,
  updateTmRecord,
} from "./prisma-repository";

function toTmDoc(record) {
  if (!record) return null;
  return {
    id: record.id,
    name: record.name,
    domain: record.domain,
    sourceLanguage: record.sourceLanguage,
    targetLanguage: record.targetLanguage,
    workspaceId: record.workspaceId,
    createdByUserId: record.createdByUserId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy,
    workspace: record.workspace,
    // Backward-compatible shape expected by the UI.
    context: {
      user: record.createdBy?.email ?? null,
      project: null,
      domain: record.domain ?? null,
      source: record.sourceLanguage,
      target: record.targetLanguage,
    },
  };
}

async function assertTmInWorkspace(id, actorUser) {
  const record = await findTmRecordById(id);
  if (!record) {
    throw new HttpError(404, "Translation memory not found");
  }

  if (
    actorUser.role !== "SUPER" &&
    record.workspaceId !== actorUser.workspaceId
  ) {
    throw new HttpError(403, "Translation memory not in your workspace");
  }

  return record;
}

export async function createTranslationMemoryService(payload, actorUser) {
  if (!actorUser?.id) {
    throw new HttpError(401, "Unauthorized");
  }

  const workspaceId = payload.workspaceId ?? actorUser.workspaceId;
  if (!workspaceId) {
    throw new HttpError(400, "A workspace is required to create a TM");
  }

  const { name, domain, source, target } = payload;

  const record = await createTmRecord({
    name,
    domain: domain || null,
    sourceLanguage: source,
    targetLanguage: target,
    createdByUserId: actorUser.id,
    workspaceId,
  });

  try {
    await createTmWithId(record.id, {
      name: record.name,
      context: {
        user: record.createdBy?.email ?? actorUser.email ?? null,
        project: payload.project ?? null,
        domain: record.domain ?? null,
        source: record.sourceLanguage,
        target: record.targetLanguage,
      },
    });
  } catch (error) {
    await deleteTmRecord(record.id).catch(() => {});
    throw error;
  }

  return toTmDoc(record);
}

export async function listTranslationMemoriesService(queryParams, actorUser) {
  const {
    name,
    domain,
    source,
    target,
    size = 100,
    workspaceId,
    user: ownerEmail,
  } = queryParams ?? {};

  const filters = { name, domain, source, target, size };

  if (actorUser.role === "SUPER") {
    if (workspaceId) filters.workspaceId = workspaceId;
  } else {
    if (!actorUser.workspaceId) {
      return { total: 0, docs: [] };
    }
    filters.workspaceId = actorUser.workspaceId;
  }

  if (ownerEmail && actorUser.email === ownerEmail) {
    filters.createdByUserId = actorUser.id;
  }

  const { docs, total } = await listTmRecords(filters);
  return { total, docs: docs.map(toTmDoc) };
}

export async function updateTranslationMemoryService(payload, actorUser) {
  const { id, name, domain } = payload;
  await assertTmInWorkspace(id, actorUser);

  const data = {};
  if (name !== undefined && name !== null && name !== "") data.name = name;
  if (domain !== undefined) data.domain = domain || null;

  if (Object.keys(data).length === 0) {
    throw new HttpError(400, "No fields to update");
  }

  const updated = await updateTmRecord(id, data);

  await updateTm(id, {
    name: updated.name,
    context: {
      domain: updated.domain ?? null,
    },
  }).catch(() => {
    // OpenSearch may not have the doc yet (legacy); ignore.
  });

  return { message: "Updated successfully", result: toTmDoc(updated) };
}

export async function deleteTranslationMemoryService(id, actorUser) {
  await assertTmInWorkspace(id, actorUser);
  await deleteTmRecord(id);
  const result = await deleteTm(id).catch(() => null);
  return { message: "Deleted successfully", result };
}

export async function getTranslationMemoryWithTusService(id, actorUser) {
  const record = await assertTmInWorkspace(id, actorUser);

  const tusResponse = await searchTusByMemoryId(id);
  const tusHits = tusResponse?.hits?.hits || [];
  const units = tusHits.map((hit) => ({ id: hit._id, ...hit._source }));

  return { translation_memory: toTmDoc(record), units };
}

function hasValidTmId(tmId) {
  return (
    tmId !== undefined &&
    tmId !== null &&
    String(tmId).trim() !== "" &&
    String(tmId) !== "0"
  );
}

export async function prepareTranslationMemoryForImportService({
  translation_memory,
  tmId,
  actorUser,
}) {
  if (hasValidTmId(tmId)) return String(tmId);

  if (!actorUser?.id) {
    throw new HttpError(401, "Unauthorized");
  }

  const workspaceId = actorUser.workspaceId;
  if (!workspaceId) {
    throw new HttpError(400, "A workspace is required to create a TM");
  }

  const context = translation_memory.context ?? {};
  const record = await createTmRecord({
    name: translation_memory.name,
    domain: context.domain ?? null,
    sourceLanguage: context.source ?? "",
    targetLanguage: context.target ?? "",
    createdByUserId: actorUser.id,
    workspaceId,
  });

  try {
    await createTmWithId(record.id, {
      name: translation_memory.name,
      context: {
        ...context,
        user: record.createdBy?.email ?? actorUser.email ?? context.user ?? null,
      },
    });
  } catch (error) {
    await deleteTmRecord(record.id).catch(() => {});
    throw error;
  }

  return record.id;
}
