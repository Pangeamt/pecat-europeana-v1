import { createProfile, deleteProfile } from "@/lib/daait";

// DAAIT mirror of a local profile: same id, so NexRelay/DAAIT can resolve the
// profile a translation request references.
export async function createProfileDaait(record) {
  return createProfile({
    id: record.id,
    name: record.name,
    description: record.description,
    instructions: record.instructions,
    formality: record.formality,
    domain: record.domain,
  });
}

export async function deleteProfileDaait(id) {
  return deleteProfile(id);
}

// DAAIT has no update endpoint (PUT/PATCH 405, re-POST 409): the only way to
// change a mirror is delete + create with the same id. A missing mirror (404
// on delete) is fine — the create right after heals it.
export async function recreateProfileDaait(record) {
  try {
    await deleteProfile(record.id);
  } catch (error) {
    if (error?.status !== 404) throw error;
  }
  return createProfileDaait(record);
}
