import { HttpError } from "@/modules/shared/http-error";
import {
  createGlossaryWithIdDaait,
  deleteGlossaryDaait,
  getGlossaryDaait,
  listGlossariesDaait,
  listGlossaryEntriesDaait,
} from "./repository";
import {
  createGlossaryRecord,
  findGlossaryRecordById,
  hardDeleteGlossaryRecord,
  listGlossaryRecords,
  softDeleteGlossaryRecord,
  updateGlossaryRecord,
} from "./prisma-repository";

function optionalText(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text || text === "undefined" || text === "null") return null;
  return text;
}

function toGlossaryDoc(record, daaitGlossary = null) {
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
    owner: daaitGlossary?.owner ?? record.workspaceId,
    total_entries: daaitGlossary?.total_entries ?? null,
    status: daaitGlossary?.status ?? null,
    context: {
      user: record.createdBy?.email ?? null,
      project: null,
      domain,
      source: record.sourceLanguage,
      target: record.targetLanguage,
    },
  };
}

function mapDaaitEntry(entry, record, index) {
  return {
    id: entry.id ?? entry._id ?? `${record.id}-${index}`,
    glossary_id: record.id,
    source_language: record.sourceLanguage,
    target_language: record.targetLanguage,
    source_text: entry.source ?? entry.source_text ?? entry.sourceText ?? "",
    translated_text:
      entry.target ??
      entry.translated_text ??
      entry.translatedText ??
      entry.translation ??
      "",
  };
}

async function assertGlossaryInWorkspace(id, actorUser) {
  const record = await findGlossaryRecordById(id);
  if (!record) {
    throw new HttpError(404, "Glossary not found");
  }

  if (
    actorUser.role !== "SUPER" &&
    record.workspaceId !== actorUser.workspaceId
  ) {
    throw new HttpError(403, "Glossary not in your workspace");
  }

  return record;
}

export async function createGlossaryService(payload, actorUser) {
  if (!actorUser?.id) {
    throw new HttpError(401, "Unauthorized");
  }

  const workspaceId = payload.workspaceId ?? actorUser.workspaceId;
  if (!workspaceId) {
    throw new HttpError(400, "A workspace is required to create a glossary");
  }

  const { name, domain, source, target } = payload;

  let record;
  try {
    record = await createGlossaryRecord({
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
      `Failed to create glossary in Prisma: ${error.message}`,
      "PRISMA_CREATE_FAILED",
    );
  }

  try {
    const daaitGlossary = await createGlossaryWithIdDaait(record.id, {
      owner: workspaceId,
      source_language: record.sourceLanguage,
      target_language: record.targetLanguage,
      entries: [{ source: "string", target: "string" }],
    });
    return toGlossaryDoc(record, daaitGlossary);
  } catch (error) {
    await hardDeleteGlossaryRecord(record.id).catch(() => {});
    throw new HttpError(
      error.status || 500,
      `Failed to create glossary in Daait: ${error.message}`,
      "DAAIT_CREATE_FAILED",
    );
  }
}

export async function listGlossariesService(queryParams, actorUser) {
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

  const { docs, total } = await listGlossaryRecords(filters);
  const daaitById = new Map();

  if (filters.workspaceId) {
    const daaitResponse = await listGlossariesDaait({
      owner: filters.workspaceId,
      size,
    });
    for (const glossary of daaitResponse?.items ?? []) {
      daaitById.set(glossary.id, glossary);
    }
  }

  return {
    total,
    docs: docs.map((record) => toGlossaryDoc(record, daaitById.get(record.id))),
  };
}

export async function getGlossaryService(id, actorUser) {
  const record = await assertGlossaryInWorkspace(id, actorUser);

  let daaitGlossary = null;
  try {
    daaitGlossary = await getGlossaryDaait(id);
  } catch {
    // DAAIT may not have the glossary metadata — return Prisma record only
  }

  return toGlossaryDoc(record, daaitGlossary);
}

export async function updateGlossaryService(payload, actorUser) {
  const { id, name, domain } = payload;
  await assertGlossaryInWorkspace(id, actorUser);

  const data = {};
  if (name !== undefined && name !== null && name !== "") data.name = name;
  if (domain !== undefined) data.domain = optionalText(domain);

  if (Object.keys(data).length === 0) {
    throw new HttpError(400, "No fields to update");
  }

  const updated = await updateGlossaryRecord(id, data);

  return { message: "Updated successfully", result: toGlossaryDoc(updated) };
}

export async function deleteGlossaryService(id, actorUser) {
  try {
    await assertGlossaryInWorkspace(id, actorUser);
    await softDeleteGlossaryRecord(id);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(
      500,
      `Failed to delete glossary in Prisma: ${error.message}`,
      "PRISMA_DELETE_FAILED",
    );
  }

  let result;
  try {
    result = await deleteGlossaryDaait(id);
  } catch (error) {
    throw new HttpError(
      error.status || 500,
      `Failed to delete glossary in Daait: ${error.message}`,
      "DAAIT_DELETE_FAILED",
    );
  }

  return { message: "Deleted successfully", result };
}

function hasValidGlossaryId(glossaryId) {
  return (
    glossaryId !== undefined &&
    glossaryId !== null &&
    String(glossaryId).trim() !== "" &&
    String(glossaryId) !== "0"
  );
}

export async function resolveGlossaryForImportService({
  form,
  glossaryId,
  actorUser,
}) {
  if (hasValidGlossaryId(glossaryId)) {
    const record = await assertGlossaryInWorkspace(
      String(glossaryId),
      actorUser,
    );
    return { record, created: false };
  }

  if (!actorUser?.id) {
    throw new HttpError(401, "Unauthorized");
  }

  const workspaceId = actorUser.workspaceId;
  if (!workspaceId) {
    throw new HttpError(400, "A workspace is required to create a glossary");
  }

  const { name, domain, source, target } = form ?? {};
  if (!name || !source || !target) {
    throw new HttpError(
      400,
      "Name, source language and target language are required to import a new glossary",
    );
  }

  const record = await createGlossaryRecord({
    name,
    domain: optionalText(domain),
    sourceLanguage: source,
    targetLanguage: target,
    createdByUserId: actorUser.id,
    workspaceId,
  });

  return { record, created: true };
}

export async function listGlossaryEntriesService(
  glossaryId,
  actorUser,
  { page = 1, size = 100, filter } = {},
) {
  const record = await assertGlossaryInWorkspace(glossaryId, actorUser);

  let response;
  try {
    const daaitParams = {
      page,
      size,
      filter: optionalText(filter) ?? undefined,
    };

    response = await listGlossaryEntriesDaait(glossaryId, daaitParams);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return { total: 0, page, size, docs: [] };
    }
    throw error;
  }

  // DAAIT /glossary/{id}/terms endpoint — response key may vary
  const rawEntries =
    response?.terms ??
    response?.entries ??
    response?.items ??
    response?.docs ??
    response?.results ??
    (Array.isArray(response) ? response : []);

  const docs = rawEntries.map((entry, index) => mapDaaitEntry(entry, record, index));

  return {
    total: response?.total ?? response?.total_entries ?? docs.length,
    page: response?.page ?? page,
    size: response?.size ?? size,
    docs,
  };
}
