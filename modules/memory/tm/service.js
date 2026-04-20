import { HttpError } from "@/modules/shared/http-error";
import {
  createTm,
  createTmWithId,
  deleteTm,
  findTmById,
  searchTms,
  searchTusByMemoryId,
  updateTm,
} from "./repository";

function mapSearchHitsToDocs(hits) {
  return hits.map((hit) => ({ id: hit._id, ...hit._source }));
}

function getTotalHits(searchResult, fallbackLength) {
  if (typeof searchResult?.hits?.total === "number") {
    return searchResult.hits.total;
  }

  return searchResult?.hits?.total?.value ?? fallbackLength;
}

function asOptionalTerm(field, value) {
  if (value === undefined || value === null || value === "") return null;
  return { term: { [field]: { value } } };
}

export async function createTranslationMemoryService(payload) {
  const { name, user, project, domain, source, target } = payload;
  return createTm({
    name,
    context: { user, project, domain, source, target },
  });
}

export async function listTranslationMemoriesService(queryParams) {
  const {
    name,
    user,
    project,
    domain,
    source,
    target,
    size = 100,
  } = queryParams;

  const must = [
    asOptionalTerm("name", name),
    asOptionalTerm("context.user", user),
    asOptionalTerm("context.project", project),
    asOptionalTerm("context.domain", domain),
    asOptionalTerm("context.source", source),
    asOptionalTerm("context.target", target),
  ].filter(Boolean);

  const query = { bool: { must } };
  const parsedSize = Number.parseInt(size, 10) || 100;
  const response = await searchTms(query, parsedSize);
  const hits = response?.hits?.hits || [];
  const docs = mapSearchHitsToDocs(hits);

  return {
    total: getTotalHits(response, docs.length),
    docs,
  };
}

export async function updateTranslationMemoryService(payload) {
  const { id, name, project, domain } = payload;
  const doc = {};
  const context = {};

  if (name) doc.name = name;
  if (project) context.project = project;
  if (domain) context.domain = domain;

  if (Object.keys(context).length > 0) {
    doc.context = context;
  }

  if (Object.keys(doc).length === 0) {
    throw new HttpError(400, "No fields to update");
  }

  const result = await updateTm(id, doc);
  return { message: "Updated successfully", result };
}

export async function deleteTranslationMemoryService(id) {
  const result = await deleteTm(id);
  return { message: "Deleted successfully", result };
}

export async function getTranslationMemoryWithTusService(id) {
  const tmResponse = await findTmById(id);
  const tmHits = tmResponse?.hits?.hits || [];
  if (tmHits.length === 0) {
    throw new HttpError(404, "Translation memory not found");
  }

  const tm = { id, ...tmHits[0]._source };
  const tusResponse = await searchTusByMemoryId(id);
  const tusHits = tusResponse?.hits?.hits || [];
  const tus = mapSearchHitsToDocs(tusHits);

  return { translation_memory: tm, units: tus };
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
}) {
  if (hasValidTmId(tmId)) return String(tmId);

  const imported = translation_memory.id
    ? await createTmWithId(translation_memory.id, {
        name: translation_memory.name,
        context: translation_memory.context,
      })
    : await createTm({
        name: translation_memory.name,
        context: translation_memory.context,
      });

  return imported._id;
}
