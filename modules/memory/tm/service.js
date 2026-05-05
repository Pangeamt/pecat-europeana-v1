import { HttpError } from "@/modules/shared/http-error";
import {
  createTmWithIdDaait,
  deleteTmDaait,
  getTmDaait,
  listTmsDaait,
} from "./repository";
import {
  createTmRecord,
  findTmRecordById,
  hardDeleteTmRecord,
  listTmRecords,
  softDeleteTmRecord,
  updateTmRecord,
} from "./prisma-repository";

function optionalText(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text || text === "undefined" || text === "null") return null;
  return text;
}

function toTmDoc(record, daaitMemory = null) {
  if (!record) return null;
  const domain = optionalText(record.domain);

  return {
    id: record.id,
    name: record.name,
    domain,
    sourceLanguage: record.sourceLanguage,
    targetLanguage: record.targetLanguage,
    workspaceId: record.workspaceId,
    createdByUserId: record.createdByUserId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy,
    workspace: record.workspace,
    owner: daaitMemory?.owner ?? record.workspaceId,
    total_entries: daaitMemory?.total_entries ?? null,
    status: daaitMemory?.status ?? null,
    // Backward-compatible shape expected by the UI.
    context: {
      user: record.createdBy?.email ?? null,
      project: null,
      domain,
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

  let record;
  try {
    record = await createTmRecord({
      name,
      domain: optionalText(domain),
      sourceLanguage: source,
      targetLanguage: target,
      createdByUserId: actorUser.id,
      workspaceId,
    });
  } catch (error) {
    throw new HttpError(
      500,
      `Failed to create translation memory in Prisma: ${error.message}`,
      "PRISMA_CREATE_FAILED",
    );
  }

  try {
    const daaitMemory = await createTmWithIdDaait(record.id, {
      owner: workspaceId,
      source_language: record.sourceLanguage,
      target_language: record.targetLanguage,
      tus: [
        {
          source: "string",
          target: "string",
        },
      ],
    });
    return toTmDoc(record, daaitMemory);
  } catch (error) {
    await hardDeleteTmRecord(record.id).catch(() => {});
    throw new HttpError(
      error.status || 500,
      `Failed to create translation memory in Daait: ${error.message}`,
      "DAAIT_CREATE_FAILED",
    );
  }
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
  const daaitById = new Map();

  if (filters.workspaceId) {
    const daaitResponse = await listTmsDaait({
      owner: filters.workspaceId,
      size,
    });
    for (const memory of daaitResponse?.items ?? []) {
      daaitById.set(memory.id, memory);
    }
  }

  return {
    total,
    docs: docs.map((record) => toTmDoc(record, daaitById.get(record.id))),
  };
}

export async function getTranslationMemoryService(id, actorUser) {
  const record = await assertTmInWorkspace(id, actorUser);
  const daaitMemory = await getTmDaait(id);
  return toTmDoc(record, daaitMemory);
}

export async function updateTranslationMemoryService(payload, actorUser) {
  const { id, name, domain } = payload;
  await assertTmInWorkspace(id, actorUser);

  const data = {};
  if (name !== undefined && name !== null && name !== "") data.name = name;
  if (domain !== undefined) data.domain = optionalText(domain);

  if (Object.keys(data).length === 0) {
    throw new HttpError(400, "No fields to update");
  }

  const updated = await updateTmRecord(id, data);

  return { message: "Updated successfully", result: toTmDoc(updated) };
}

export async function deleteTranslationMemoryService(id, actorUser) {
  try {
    await assertTmInWorkspace(id, actorUser);
    await softDeleteTmRecord(id);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(
      500,
      `Failed to delete translation memory in Prisma: ${error.message}`,
      "PRISMA_DELETE_FAILED",
    );
  }

  let result;
  try {
    result = await deleteTmDaait(id);
  } catch (error) {
    throw new HttpError(
      error.status || 500,
      `Failed to delete translation memory in Daait: ${error.message}`,
      "DAAIT_DELETE_FAILED",
    );
  }

  return { message: "Deleted successfully", result };
}

function hasValidTmId(tmId) {
  return (
    tmId !== undefined &&
    tmId !== null &&
    String(tmId).trim() !== "" &&
    String(tmId) !== "0"
  );
}

export async function resolveTranslationMemoryForImportService({
  form,
  tmId,
  actorUser,
}) {
  if (hasValidTmId(tmId)) {
    const record = await assertTmInWorkspace(String(tmId), actorUser);
    return { record, created: false };
  }

  if (!actorUser?.id) {
    throw new HttpError(401, "Unauthorized");
  }

  const workspaceId = actorUser.workspaceId;
  if (!workspaceId) {
    throw new HttpError(400, "A workspace is required to create a TM");
  }

  const { name, domain, source, target } = form ?? {};
  if (!name || !source || !target) {
    throw new HttpError(
      400,
      "Name, source language and target language are required to import a new TM",
    );
  }

  const record = await createTmRecord({
    name,
    domain: optionalText(domain),
    sourceLanguage: source,
    targetLanguage: target,
    createdByUserId: actorUser.id,
    workspaceId,
  });

  return { record, created: true };
}
