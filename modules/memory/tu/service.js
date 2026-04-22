import {
  DEFAULT_MIN_SIMILARITY,
  levenshteinSimilarity,
  jaccardSimilarity,
} from "@/modules/shared/similarity";
import { HttpError } from "@/modules/shared/http-error";
import { findTmRecordById } from "@/modules/memory/tm/prisma-repository";
import { createTu, getTmById, getTuById, searchTus, updateTu } from "./repository";

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

function asRequiredTerm(field, value) {
  return { term: { [field]: { value } } };
}

function asOptionalTerm(field, value) {
  if (value === undefined || value === null || value === "") return null;
  return asRequiredTerm(field, value);
}

function mapTuHit(hit) {
  return { id: hit._id, ...hit._source };
}

function mapTuHitForAll(hit) {
  return {
    id: hit._id,
    source_language: hit._source.source_language,
    target_language: hit._source.target_language,
    source_text: hit._source.source_text,
    translated_text: hit._source.translated_text,
    context: hit._source.context,
  };
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

async function assertTranslationUnitExists(translationUnitId) {
  try {
    await getTuById(translationUnitId);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(
        409,
        `Translation unit with id ${translationUnitId} does not exist.`,
      );
    }
    throw error;
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

  await assertTmAccessibleByActor(translation_memory_id, actorUser);

  const must = [
    asRequiredTerm("translation_memory_id", translation_memory_id),
    asRequiredTerm("source_language", source_language),
    asRequiredTerm("target_language", target_language),
    asOptionalTerm("context.user", user),
    asOptionalTerm("context.project", project),
    asOptionalTerm("context.domain", domain),
  ].filter(Boolean);

  must.push(
    perTerm
      ? { match_phrase: { source_text } }
      : { match: { source_text } },
  );

  const response = await searchTus({ query: { bool: { must } } });
  const hits = response?.hits?.hits || [];
  const docs = [];

  for (const hit of hits) {
    if (perTerm) {
      docs.push(mapTuHit(hit));
      continue;
    }

    const sourceText = hit?._source?.source_text || "";
    const lev = levenshteinSimilarity(source_text, sourceText);
    const jac = jaccardSimilarity(source_text, sourceText);

    if (lev >= minSimilarity && jac >= minSimilarity) {
      docs.push({
        ...mapTuHit(hit),
        similarity: { levenshtein: lev, jaccard: jac },
      });
    }
  }

  return { total: docs.length, docs };
}

export async function listAllTranslationUnitsService(
  translationMemoryId,
  actorUser,
) {
  if (actorUser) {
    await assertTmAccessibleByActor(translationMemoryId, actorUser);
  }

  const response = await searchTus(
    {
      query: {
        bool: {
          must: [asRequiredTerm("translation_memory_id", translationMemoryId)],
        },
      },
    },
    10000,
  );

  const hits = response?.hits?.hits || [];
  const docs = hits.map(mapTuHitForAll);

  return { total: docs.length, docs };
}

export async function createTranslationUnitService(payload, actorUser) {
  const {
    translation_memory_id,
    source_language,
    target_language,
    source_text,
    translated_text,
    user,
    project,
    domain,
  } = payload;

  await assertTmAccessibleByActor(translation_memory_id, actorUser);
  await assertTranslationMemoryExists(translation_memory_id);

  const now = new Date().toISOString();
  return createTu({
    translation_memory_id,
    source_language,
    target_language,
    source_text,
    translated_text,
    context: { user, project, domain },
    create_date: now,
    update_date: now,
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
    user,
    project,
    domain,
  } = payload;

  await assertTmAccessibleByActor(translation_memory_id, actorUser);
  await assertTranslationMemoryExists(translation_memory_id);
  await assertTranslationUnitExists(translation_unit_id);

  return updateTu(translation_unit_id, {
    translation_memory_id,
    source_language,
    target_language,
    source_text,
    translated_text,
    context: { user, project, domain },
    update_date: new Date().toISOString(),
  });
}
