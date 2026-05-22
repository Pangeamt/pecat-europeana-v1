import {
  DEFAULT_MIN_SIMILARITY,
  levenshteinSimilarity,
  jaccardSimilarity,
} from "@/modules/shared/similarity";
import { HttpError } from "@/modules/shared/http-error";
import { findTmRecordById } from "@/modules/memory/tm/prisma-repository";
import {
  createTu,
  deleteTu,
  getTmById,
  listAllTus,
  listTus,
  listTusPage,
  searchTus,
  updateTu,
  appendTu,
} from "./repository";

async function assertTmAccessibleByActor(translationMemoryId, actorUser) {
  if (!translationMemoryId) {
    throw new HttpError(400, "translation_memory_id is required");
  }

  const record = await findTmRecordById(translationMemoryId);
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

function mapDaaitTu(unit, record) {
  return {
    id: unit.id,
    translation_memory_id: record.id,
    source_language: record.sourceLanguage,
    target_language: record.targetLanguage,
    source_text: unit.source,
    translated_text: unit.target,
    context: {
      user: record.createdBy?.email ?? null,
      project: null,
      domain: record.domain ?? null,
    },
  };
}

function normalizeSearchResponse(response) {
  const items = response?.items ?? response?.docs ?? response?.results ?? [];
  return {
    items: Array.isArray(items) ? items : [],
    total: response?.total ?? (Array.isArray(items) ? items.length : 0),
  };
}

function mapSearchResultUnit(unit, record) {
  const doc = mapDaaitTu(unit, record);
  const score = unit.score ?? unit.similarity ?? unit.tm_score;

  if (typeof unit.similarity === "object" && unit.similarity !== null) {
    doc.similarity = unit.similarity;
    return doc;
  }

  if (score != null && score !== "") {
    const numeric = Number.parseFloat(String(score));
    if (Number.isFinite(numeric)) {
      doc.similarity = { levenshtein: numeric, jaccard: numeric };
    }
  }

  return doc;
}

async function assertTranslationMemoryExists(translationMemoryId) {
  try {
    await getTmById(translationMemoryId);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(
        409,
        `Translation memory with id ${translationMemoryId} does not exist.`,
      );
    }
    throw error;
  }
}

function hasSameDirection(record, sourceLanguage, targetLanguage) {
  return (
    record.sourceLanguage === sourceLanguage &&
    record.targetLanguage === targetLanguage
  );
}

function assertPayloadDirection(record, sourceLanguage, targetLanguage) {
  if (!hasSameDirection(record, sourceLanguage, targetLanguage)) {
    throw new HttpError(
      400,
      "TU language direction does not match the translation memory",
    );
  }
}

export async function searchTranslationUnitsService(queryParams, actorUser) {
  const {
    translation_memory_id,
    source_language,
    target_language,
    source_text,
    user,
    project,
    domain,
    perTerm = false,
    minSimilarity = DEFAULT_MIN_SIMILARITY,
  } = queryParams;

  const record = await assertTmAccessibleByActor(
    translation_memory_id,
    actorUser,
  );
  if (!hasSameDirection(record, source_language, target_language)) {
    return { total: 0, docs: [] };
  }

  if (user && user !== record.createdBy?.email) return { total: 0, docs: [] };
  if (domain && domain !== record.domain) return { total: 0, docs: [] };
  if (project) return { total: 0, docs: [] };

  const response = await listTus(translation_memory_id);
  const units = response?.items ?? [];
  const docs = [];

  for (const unit of units) {
    const doc = mapDaaitTu(unit, record);
    if (perTerm) {
      if (doc.source_text.includes(source_text)) {
        docs.push(doc);
      }
      continue;
    }

    const sourceText = doc.source_text || "";
    const lev = levenshteinSimilarity(source_text, sourceText);
    const jac = jaccardSimilarity(source_text, sourceText);

    if (lev >= minSimilarity && jac >= minSimilarity) {
      docs.push({
        ...doc,
        similarity: { levenshtein: lev, jaccard: jac },
      });
    }
  }

  docs.sort((a, b) => {
    const aScore = a.similarity?.levenshtein ?? 1;
    const bScore = b.similarity?.levenshtein ?? 1;
    return bScore - aScore;
  });

  return { total: docs.length, docs };
}

export async function searchTranslationUnitsByQueryService(
  { translation_memory_id, q },
  actorUser,
) {
  const record = await assertTmAccessibleByActor(
    translation_memory_id,
    actorUser,
  );

  const response = await searchTus(translation_memory_id, q);
  const { items, total } = normalizeSearchResponse(response);
  const docs = items.map((unit) => mapSearchResultUnit(unit, record));

  return { total, docs };
}

export async function listAllTranslationUnitsService(
  translationMemoryId,
  actorUser,
) {
  const record = actorUser
    ? await assertTmAccessibleByActor(translationMemoryId, actorUser)
    : await findTmRecordById(translationMemoryId);

  if (!record) {
    throw new HttpError(404, "Translation memory not found");
  }

  const response = await listAllTus(translationMemoryId);
  const docs = (response?.items ?? []).map((unit) => mapDaaitTu(unit, record));

  return { total: docs.length, docs };
}

export async function listTranslationUnitsPageService(
  translationMemoryId,
  actorUser,
  { page = 1, size = 100 } = {},
) {
  const record = actorUser
    ? await assertTmAccessibleByActor(translationMemoryId, actorUser)
    : await findTmRecordById(translationMemoryId);

  if (!record) {
    throw new HttpError(404, "Translation memory not found");
  }

  const response = await listTusPage(translationMemoryId, { page, size });
  const docs = (response?.items ?? []).map((unit) => mapDaaitTu(unit, record));

  return {
    total: response?.total ?? docs.length,
    page: response?.page ?? page,
    size: response?.size ?? size,
    docs,
  };
}

export async function createTranslationUnitService(payload, actorUser) {
  const {
    translation_memory_id,
    source_language,
    target_language,
    source_text,
    translated_text,
  } = payload;

  const record = await assertTmAccessibleByActor(
    translation_memory_id,
    actorUser,
  );
  assertPayloadDirection(record, source_language, target_language);
  await assertTranslationMemoryExists(translation_memory_id);

  return createTu(translation_memory_id, {
    source: source_text,
    target: translated_text,
  });
}

export async function updateTranslationUnitService(payload, actorUser) {
  const {
    translation_unit_id,
    translation_memory_id,
    source_language,
    target_language,
    source_text,
    translated_text,
  } = payload;

  const record = await assertTmAccessibleByActor(
    translation_memory_id,
    actorUser,
  );
  assertPayloadDirection(record, source_language, target_language);
  await assertTranslationMemoryExists(translation_memory_id);

  const result = await updateTu(translation_memory_id, translation_unit_id, {
    source: source_text,
    target: translated_text,
  });
  return mapDaaitTu(result, record);
}

export async function deleteTranslationUnitService(payload, actorUser) {
  const { translation_memory_id, translation_unit_id } = payload;

  await assertTmAccessibleByActor(translation_memory_id, actorUser);
  await assertTranslationMemoryExists(translation_memory_id);

  return deleteTu(translation_memory_id, translation_unit_id);
}

export async function appendTranslationUnitService(payload, actorUser) {
  const { tmIds, source, target } = payload;

  await Promise.all(
    tmIds.map(async (tmId) => {
      await assertTmAccessibleByActor(tmId, actorUser);
      await assertTranslationMemoryExists(tmId);
      await appendTu(tmId, source, target);
    }),
  );

  return { success: true, tmIds, source, target };
}
