import { httpClient } from "./http-client";

export type ProfileFormality = "FORMAL" | "NEUTRO" | "INFORMAL";

export interface ProfileAsset {
  id: string;
  name: string;
  domain?: string | null;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface Profile {
  id: string;
  name: string;
  description?: string | null;
  formality: ProfileFormality;
  instructions?: string | null;
  domain?: string | null;
  /** Name of the DAAIT quality preset, or null. */
  llmPreset?: string | null;
  workspaceId: string;
  createdByUserId: string;
  createdBy?: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
  tms: ProfileAsset[];
  glossaries: ProfileAsset[];
}

export interface CreateProfilePayload {
  name: string;
  description?: string;
  formality?: ProfileFormality;
  instructions?: string;
  domain?: string;
  /** DAAIT preset name; null removes it. */
  llmPreset?: string | null;
  workspaceId?: string;
  tmIds?: string[];
  glossaryIds?: string[];
}

export type UpdateProfilePayload = Partial<CreateProfilePayload>;

/** A DAAIT quality preset a profile can point to (only its name is stored). */
export interface DaaitPreset {
  name: string;
  description?: string | null;
}

export interface ListProfilesQuery {
  workspaceId?: string;
}

export const listProfilesRequest = async (query?: ListProfilesQuery) => {
  const response = await httpClient.get<{ profiles: Profile[] }>(
    "/api/profiles",
    { params: query },
  );
  return response.data;
};

export const listDaaitPresetsRequest = async () => {
  const response = await httpClient.get<{ presets: DaaitPreset[] }>(
    "/api/profiles/presets",
  );
  return response.data;
};

export const fetchProfileByIdRequest = async (profileId: string) => {
  const response = await httpClient.get<{ profile: Profile }>(
    `/api/profiles/${profileId}`,
  );
  return response.data;
};

export const addProfileRequest = async (payload: CreateProfilePayload) => {
  const response = await httpClient.post<{ profile: Profile }>(
    "/api/profiles",
    payload,
  );
  return response.data;
};

export const updateProfileRequest = async (
  profileId: string,
  payload: UpdateProfilePayload,
) => {
  const response = await httpClient.patch<{ profile: Profile }>(
    `/api/profiles/${profileId}`,
    payload,
  );
  return response.data;
};

export const deleteProfileRequest = async (profileId: string) => {
  const response = await httpClient.delete<{ status: string }>(
    `/api/profiles/${profileId}`,
  );
  return response.data;
};
