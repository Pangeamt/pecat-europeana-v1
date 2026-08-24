import {
  createProfile,
  deleteProfile,
  updateProfile as updateProfileDaaitApi,
} from "@/lib/daait";

// DAAIT mirror of a local profile: same id, so the DAAIT translation and
// post-editing pipeline can resolve the profile a request references.

function toDaaitProfilePayload(record) {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    instructions: record.instructions,
    formality: record.formality,
    domain: record.domain,
    source_language: record.sourceLanguage || undefined,
    target_language: record.targetLanguage || undefined,
    task_level: record.taskLevel || undefined,
    params_autope: record.llmModels
      ? { llm_models: record.llmModels }
      : undefined,
  };
}

export async function createProfileDaait(record) {
  return createProfile(toDaaitProfilePayload(record));
}

export async function deleteProfileDaait(id) {
  return deleteProfile(id);
}

// PATCH /profile updates the mirror in place; a 404 means the profile predates
// the mirror, so it is healed by creating it (needs the record's languages).
export async function syncProfileDaait(record) {
  const { source_language, target_language, ...patch } =
    toDaaitProfilePayload(record);
  try {
    return await updateProfileDaaitApi(patch);
  } catch (error) {
    if (error?.status === 404) return createProfileDaait(record);
    throw error;
  }
}
