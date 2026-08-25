import { HttpError } from "../shared/http-error";
import { assertWorkspaceAssetAccess } from "../shared/roles";
import { MEMORY_ASSET_READY_STATUS } from "../memory/status";
import {
  createProfile,
  findProfileById,
  findProfileByIdBasic,
  findProfiles,
  findGlossaryAssetsInWorkspace,
  findTmAssetsInWorkspace,
  hardDeleteProfileRecord,
  softDeleteProfileRecord,
  updateProfile,
} from "./repository";
import {
  createProfileDaait,
  deleteProfileDaait,
  syncProfileDaait,
  syncProfileResourcesDaait,
} from "./daait-repository";

function optionalText(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text || text === "undefined" || text === "null") return null;
  return text;
}

function toProfileDoc(record) {
  if (!record) return null;

  return {
    id: record.id,
    name: record.name,
    description: record.description,
    formality: record.formality,
    instructions: record.instructions,
    domain: record.domain,
    sourceLanguage: record.sourceLanguage,
    targetLanguage: record.targetLanguage,
    taskLevel: record.taskLevel,
    llmModels: record.llmModels,
    workspaceId: record.workspaceId,
    createdByUserId: record.createdByUserId,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    tms: (record.profileTms ?? []).map((row) => row.tm),
    glossaries: (record.profileGlossaries ?? []).map((row) => row.glossary),
  };
}

async function assertProfileInWorkspace(id, actorUser) {
  const record = await findProfileByIdBasic(id);
  if (!record) {
    throw new HttpError(404, "Profile not found");
  }

  if (
    actorUser.role !== "SUPER" &&
    record.workspaceId !== actorUser.workspaceId
  ) {
    throw new HttpError(403, "Profile not in your workspace");
  }

  return record;
}

async function resolveAssetIds(tmIds, glossaryIds, workspaceId) {
  const [tmRows, glossaryRows] = await Promise.all([
    findTmAssetsInWorkspace(tmIds ?? [], workspaceId),
    findGlossaryAssetsInWorkspace(glossaryIds ?? [], workspaceId),
  ]);

  if (tmIds?.length && tmRows.length !== tmIds.length) {
    throw new HttpError(
      400,
      "Some translation memories do not exist or are not in the workspace",
    );
  }

  if (glossaryIds?.length && glossaryRows.length !== glossaryIds.length) {
    throw new HttpError(
      400,
      "Some glossaries do not exist or are not in the workspace",
    );
  }

  // Only DAAIT-ready assets (status SUCCESS) can be attached to a profile.
  if (tmRows.some((row) => row.status !== MEMORY_ASSET_READY_STATUS)) {
    throw new HttpError(
      400,
      "Some translation memories are not ready yet (status must be SUCCESS)",
      "TM_NOT_READY",
    );
  }

  if (glossaryRows.some((row) => row.status !== MEMORY_ASSET_READY_STATUS)) {
    throw new HttpError(
      400,
      "Some glossaries are not ready yet (status must be SUCCESS)",
      "GLOSSARY_NOT_READY",
    );
  }

  return {
    validTmIds: tmRows.map((row) => row.id),
    validGlossaryIds: glossaryRows.map((row) => row.id),
  };
}

export async function listProfilesService(query, actorUser) {
  assertWorkspaceAssetAccess(actorUser);
  const where = {};

  if (actorUser.role === "SUPER") {
    if (query?.workspaceId) where.workspaceId = query.workspaceId;
  } else {
    if (!actorUser.workspaceId) return [];
    where.workspaceId = actorUser.workspaceId;
  }

  const records = await findProfiles(where);
  return records.map(toProfileDoc);
}

export async function getProfileByIdService(id, actorUser) {
  assertWorkspaceAssetAccess(actorUser);
  await assertProfileInWorkspace(id, actorUser);
  const record = await findProfileById(id);
  return toProfileDoc(record);
}

export async function createProfileService(payload, actorUser) {
  if (!actorUser?.id) {
    throw new HttpError(401, "Unauthorized");
  }
  assertWorkspaceAssetAccess(actorUser);

  const workspaceId = payload.workspaceId ?? actorUser.workspaceId;
  if (!workspaceId) {
    throw new HttpError(400, "A workspace is required to create a profile");
  }

  if (
    actorUser.role !== "SUPER" &&
    workspaceId !== actorUser.workspaceId
  ) {
    throw new HttpError(403, "You cannot create profiles in that workspace");
  }

  const { validTmIds, validGlossaryIds } = await resolveAssetIds(
    payload.tmIds,
    payload.glossaryIds,
    workspaceId,
  );

  let record;
  try {
    record = await createProfile(
      {
        name: payload.name,
        description: optionalText(payload.description),
        formality: payload.formality ?? "FORMAL",
        instructions: optionalText(payload.instructions),
        domain: optionalText(payload.domain),
        sourceLanguage: optionalText(payload.sourceLanguage),
        targetLanguage: optionalText(payload.targetLanguage),
        taskLevel: payload.taskLevel ?? "MEDIUM",
        llmModels: payload.llmModels ?? null,
        createdByUserId: actorUser.id,
        workspaceId,
      },
      validTmIds,
      validGlossaryIds,
    );
  } catch (error) {
    throw new HttpError(
      500,
      `Failed to create profile in Prisma: ${error.message}`,
      "PRISMA_CREATE_FAILED",
    );
  }

  // Mirror the profile in DAAIT (same id) and attach its TMs/glossaries as
  // resources — DAAIT only matches memories attached to the profile, so a
  // mirror without resources translates without TM hits.
  try {
    await createProfileDaait(record);
    await syncProfileResourcesDaait(
      record.id,
      [...validTmIds, ...validGlossaryIds],
      [],
    );
  } catch (error) {
    await hardDeleteProfileRecord(record.id).catch(() => {});
    await deleteProfileDaait(record.id).catch(() => {});
    throw new HttpError(
      error.status || 500,
      `Failed to create profile in Daait: ${error.message}`,
      "DAAIT_CREATE_FAILED",
    );
  }

  return toProfileDoc(record);
}

export async function updateProfileService(id, payload, actorUser) {
  assertWorkspaceAssetAccess(actorUser);
  const existing = await assertProfileInWorkspace(id, actorUser);

  const data = {};
  if (payload.name !== undefined && payload.name !== null && payload.name !== "") {
    data.name = payload.name;
  }
  if (payload.description !== undefined) {
    data.description = optionalText(payload.description);
  }
  if (payload.formality !== undefined && payload.formality !== null) {
    data.formality = payload.formality;
  }
  if (payload.instructions !== undefined) {
    data.instructions = optionalText(payload.instructions);
  }
  if (payload.domain !== undefined) {
    data.domain = optionalText(payload.domain);
  }
  if (payload.taskLevel !== undefined && payload.taskLevel !== null) {
    data.taskLevel = payload.taskLevel;
  }
  if (payload.llmModels !== undefined) {
    data.llmModels = payload.llmModels;
  }

  let tmIds;
  let glossaryIds;
  if (payload.tmIds !== undefined || payload.glossaryIds !== undefined) {
    const { validTmIds, validGlossaryIds } = await resolveAssetIds(
      payload.tmIds,
      payload.glossaryIds,
      existing.workspaceId,
    );
    if (payload.tmIds !== undefined) tmIds = validTmIds;
    if (payload.glossaryIds !== undefined) glossaryIds = validGlossaryIds;
  }

  if (
    Object.keys(data).length === 0 &&
    tmIds === undefined &&
    glossaryIds === undefined
  ) {
    throw new HttpError(400, "No fields to update");
  }

  // Snapshot the current asset links before replacing them, so the mirror's
  // resource diff (attach/detach) can be computed after the update.
  let previousAssetIds = null;
  if (tmIds !== undefined || glossaryIds !== undefined) {
    const before = await findProfileById(id);
    previousAssetIds = [
      ...(before?.profileTms ?? []).map((row) => row.tmId),
      ...(before?.profileGlossaries ?? []).map((row) => row.glossaryId),
    ];
  }

  const record = await updateProfile(id, data, tmIds, glossaryIds);

  try {
    // Field changes PATCH the mirror; asset changes sync its attached
    // resources — DAAIT only matches memories attached to the profile.
    if (Object.keys(data).length > 0) {
      await syncProfileDaait(record);
    }
    if (previousAssetIds !== null) {
      const desiredAssetIds = [
        ...(record.profileTms ?? []).map((row) => row.tmId),
        ...(record.profileGlossaries ?? []).map((row) => row.glossaryId),
      ];
      try {
        await syncProfileResourcesDaait(id, desiredAssetIds, previousAssetIds);
      } catch (error) {
        if (error?.status !== 404) throw error;
        // Mirror missing (pre-mirror profile): heal it, then attach all.
        await syncProfileDaait(record);
        await syncProfileResourcesDaait(id, desiredAssetIds, []);
      }
    }
  } catch (error) {
    throw new HttpError(
      error.status || 500,
      `Failed to update profile in Daait: ${error.message}`,
      "DAAIT_UPDATE_FAILED",
    );
  }

  return toProfileDoc(record);
}

export async function deleteProfileService(id, actorUser) {
  assertWorkspaceAssetAccess(actorUser);
  await assertProfileInWorkspace(id, actorUser);
  await softDeleteProfileRecord(id);

  // A missing mirror (pre-mirror profile) is fine; anything else must
  // surface, or the DAAIT copy would silently outlive the local profile.
  try {
    await deleteProfileDaait(id);
  } catch (error) {
    if (error?.status !== 404) {
      throw new HttpError(
        error.status || 500,
        `Failed to delete profile in Daait: ${error.message}`,
        "DAAIT_DELETE_FAILED",
      );
    }
  }
}
