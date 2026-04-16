import levenshtein from "fast-levenshtein";
import {
  getDocument,
  indexDocument,
  searchDocuments,
  updateDocument,
} from "../../lib/opensearch";
import { HttpError } from "../shared/http-error";

const MIN_SIMILARITY = 0.5;

const levenshteinSimilarity = (s1, s2) => {
  const source = String(s1 || "");
  const target = String(s2 || "");
  if (!source && !target) {
    return 1;
  }

  const distance = levenshtein.get(source.toLowerCase(), target.toLowerCase());
  const maxLength = Math.max(source.length, target.length);
  return maxLength === 0 ? 0 : (maxLength - distance) / maxLength;
};

const jaccardSimilarity = (s1, s2) => {
  const wordsA = new Set(String(s1 || "").toLowerCase().split(" ").filter(Boolean));
  const wordsB = new Set(String(s2 || "").toLowerCase().split(" ").filter(Boolean));
  const union = new Set([...wordsA, ...wordsB]);
  if (union.size === 0) {
    return 0;
  }

  const intersection = new Set([...wordsA].filter((word) => wordsB.has(word)));
  return intersection.size / union.size;
};

function asRequiredTerm(field, value) {
  return {
    term: {
      [field]: {
        value,
      },
    },
  };
}

function asOptionalTerm(field, value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return asRequiredTerm(field, value);
}

function mapTuHit(hit) {
  return {
    id: hit._id,
    ...hit._source,
  };
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
    await getDocument("translation_memory", translationMemoryId);
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
    await getDocument("translation_units", translationUnitId);
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

export async function searchTranslationUnitsService(queryParams) {
  const {
    translation_memory_id,
    source_language,
    target_language,
    source_text,
    user = undefined,
    project = undefined,
    domain = undefined,
    perTerm = false,
  } = queryParams;

  const must = [
    asRequiredTerm("translation_memory_id", translation_memory_id),
    asRequiredTerm("source_language", source_language),
    asRequiredTerm("target_language", target_language),
    asOptionalTerm("context.user", user),
    asOptionalTerm("context.project", project),
    asOptionalTerm("context.domain", domain),
  ].filter(Boolean);

  if (perTerm) {
    must.push({
      match_phrase: {
        source_text,
      },
    });
  } else {
    must.push({
      match: {
        source_text,
      },
    });
  }

  const response = await searchDocuments(
    "translation_units",
    {
      query: {
        bool: {
          must,
        },
      },
    },
    1000,
  );

  const hits = response?.hits?.hits || [];
  const docs = [];

  for (const hit of hits) {
    if (perTerm) {
      docs.push(mapTuHit(hit));
      continue;
    }

    const sourceText = hit?._source?.source_text || "";
    const levenshteinValue = levenshteinSimilarity(source_text, sourceText);
    const jaccardValue = jaccardSimilarity(source_text, sourceText);

    if (levenshteinValue >= MIN_SIMILARITY && jaccardValue >= MIN_SIMILARITY) {
      docs.push({
        ...mapTuHit(hit),
        similarity: {
          levenshtein: levenshteinValue,
          jaccard: jaccardValue,
        },
      });
    }
  }

  return {
    total: docs.length,
    docs,
  };
}

export async function listAllTranslationUnitsService(translationMemoryId) {
  const response = await searchDocuments(
    "translation_units",
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

  return {
    total: docs.length,
    docs,
  };
}

export async function createTranslationUnitService(payload) {
  const {
    translation_memory_id,
    source_language,
    target_language,
    source_text,
    translated_text,
    user = undefined,
    project = undefined,
    domain = undefined,
  } = payload;

  await assertTranslationMemoryExists(translation_memory_id);

  return indexDocument("translation_units", {
    translation_memory_id,
    source_language,
    target_language,
    source_text,
    translated_text,
    context: { user, project, domain },
    create_date: new Date().toISOString(),
    update_date: new Date().toISOString(),
  });
}

export async function updateTranslationUnitService(payload) {
  const {
    translation_unit_id,
    translation_memory_id,
    source_language,
    target_language,
    source_text,
    translated_text,
    user = undefined,
    project = undefined,
    domain = undefined,
  } = payload;

  await assertTranslationMemoryExists(translation_memory_id);
  await assertTranslationUnitExists(translation_unit_id);

  return updateDocument("translation_units", translation_unit_id, {
    translation_memory_id,
    source_language,
    target_language,
    source_text,
    translated_text,
    context: { user, project, domain },
    update_date: new Date().toISOString(),
  });
}
