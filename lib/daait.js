import axios from "axios";
import FormData from "form-data";
import { HttpError } from "@/modules/shared/http-error";

const DEFAULT_DAAIT_API_HOST = "https://api-priv.pangeanic.com/service/autope2";

const DAAIT_API_HOST = (
  process.env.DAAIT_API_HOST || DEFAULT_DAAIT_API_HOST
).replace(/\/$/, "");
const DEFAULT_DAAIT_EXPORT_TIMEOUT_MS = 55_000;
const DAAIT_EXPORT_TIMEOUT_MS = parsePositiveNumber(
  process.env.DAAIT_EXPORT_TIMEOUT_MS,
  DEFAULT_DAAIT_EXPORT_TIMEOUT_MS,
);
// Listing calls are enrichment-only (the source of truth is MySQL), so they
// must fail fast instead of hanging until the DAAIT gateway times out.
const DEFAULT_DAAIT_LIST_TIMEOUT_MS = 10_000;
const DAAIT_LIST_TIMEOUT_MS = parsePositiveNumber(
  process.env.DAAIT_LIST_TIMEOUT_MS,
  DEFAULT_DAAIT_LIST_TIMEOUT_MS,
);

// Translation and LLM post-editing run whole documents through DAAIT's LLM
// pipeline, so they get a much larger budget than metadata CRUD.
const DEFAULT_DAAIT_CONTENT_TIMEOUT_MS = 300_000;
const DAAIT_CONTENT_TIMEOUT_MS = parsePositiveNumber(
  process.env.DAAIT_CONTENT_TIMEOUT_MS,
  DEFAULT_DAAIT_CONTENT_TIMEOUT_MS,
);

const daaitClient = axios.create({
  baseURL: DAAIT_API_HOST,
  headers: { accept: "application/json" },
});

function parsePositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getErrorData(error) {
  const data = error?.response?.data;
  if (Buffer.isBuffer(data)) {
    const text = data.toString("utf8");
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return data;
}

function getErrorMessage(error, fallback) {
  const data = getErrorData(error);
  return (
    data?.detail ||
    data?.message ||
    data?.error ||
    (typeof data === "string" ? data : null) ||
    error?.message ||
    fallback
  );
}

function isTimeoutError(error) {
  return (
    error?.code === "ECONNABORTED" ||
    error?.code === "ETIMEDOUT" ||
    error?.message?.toLowerCase().includes("timeout")
  );
}

function mapAndThrow(error, fallbackMessage = "DAAIT request failed") {
  if (error instanceof HttpError) throw error;

  if (isTimeoutError(error)) {
    throw new HttpError(
      504,
      `${fallbackMessage}: request timed out`,
      "DAAIT_TIMEOUT",
    );
  }

  if (!error?.response) {
    throw new HttpError(
      502,
      `${fallbackMessage}: DAAIT service is unavailable`,
      "DAAIT_UNAVAILABLE",
    );
  }

  const status = error?.response?.status || 500;
  const code = status >= 500 ? "DAAIT_UPSTREAM_ERROR" : null;
  throw new HttpError(status, getErrorMessage(error, fallbackMessage), code);
}

async function toFileBuffer(file) {
  if (Buffer.isBuffer(file)) return file;
  if (file?.arrayBuffer) {
    return Buffer.from(await file.arrayBuffer());
  }
  return file;
}

export async function createMemory({
  id,
  source_language,
  target_language,
  owner,
  tus = [],
}) {
  try {
    const response = await daaitClient.post("/memory", {
      id,
      source_language,
      target_language,
      owner,
      tus,
    });
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to create DAAIT memory");
  }
}

export async function listMemories({ owner, page, size } = {}) {
  try {
    const response = await daaitClient.get("/memory", {
      params: { owner, page, size },
      timeout: DAAIT_LIST_TIMEOUT_MS,
    });
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to list DAAIT memories");
  }
}

export async function importMemoryTmx({
  file,
  id,
  owner,
  source_language,
  target_language,
}) {
  try {
    const form = new FormData();
    form.append("file", await toFileBuffer(file), file?.name || "memory.tmx");
    form.append("source_language", source_language);
    form.append("target_language", target_language);
    form.append("id", id);
    form.append("owner", owner);

    const response = await daaitClient.post("/memory/import", form, {
      headers: form.getHeaders(),
    });
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to import DAAIT memory");
  }
}

export async function getMemory(id, { timeout } = {}) {
  try {
    const response = await daaitClient.get(
      `/memory/${encodeURIComponent(id)}`,
      timeout ? { timeout } : undefined,
    );
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to get DAAIT memory");
  }
}

export async function exportMemory(id, format = "tmx") {
  try {
    const response = await daaitClient.get(
      `/memory/${encodeURIComponent(id)}/export`,
      {
        params: { format },
        responseType: "arraybuffer",
        timeout: DAAIT_EXPORT_TIMEOUT_MS,
      },
    );
    return Buffer.from(response.data);
  } catch (error) {
    mapAndThrow(error, "Failed to export DAAIT memory");
  }
}

export async function deleteMemory(id) {
  try {
    const response = await daaitClient.delete(
      `/memory/${encodeURIComponent(id)}`,
    );
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to delete DAAIT memory");
  }
}

export async function getMemoryTus(id, { page, size } = {}) {
  try {
    const response = await daaitClient.get(
      `/memory/${encodeURIComponent(id)}/tus`,
      { params: { page, size } },
    );
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to get DAAIT memory TUs");
  }
}

export async function addMemoryTus(id, tus) {
  try {
    const response = await daaitClient.post(
      `/memory/${encodeURIComponent(id)}/tus`,
      { tus },
    );
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to add DAAIT memory TUs");
  }
}

export async function updateMemoryTu(id, tuId, tu) {
  try {
    const response = await daaitClient.put(
      `/memory/${encodeURIComponent(id)}/tus/${encodeURIComponent(tuId)}`,
      tu,
    );
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to update DAAIT memory TU");
  }
}

export async function deleteMemoryTu(id, tuId) {
  try {
    const response = await daaitClient.delete(
      `/memory/${encodeURIComponent(id)}/tus/${encodeURIComponent(tuId)}`,
    );
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to delete DAAIT memory TU");
  }
}

export async function searchMemoryTus(id, query) {
  try {
    const response = await daaitClient.get(
      `/memory/${encodeURIComponent(id)}/tus/search`,
      { params: { q: query } },
    );
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to search DAAIT memory TUs");
  }
}

/*CONTENT API (translation + LLM post-editing)*/

/**
 * PECAT translation endpoint — the NexRelay replacement. Returns
 * { segments: [{ source, target, tm_info[], glossary_info[] }] } in input
 * order. NOTE: unlike NexRelay it does NOT return an MTQE score; scoring is
 * a separate pipeline stage against the MTQE service.
 */
export async function pecatTranslate({
  profile_id,
  source_language,
  target_language,
  texts,
  tm_mode = "standard",
  tm_threshold,
  tm_ids = [],
  glossary_ids = [],
  user_id,
  workspace,
}) {
  try {
    const response = await daaitClient.post(
      "/content/pecat",
      {
        profile_id: profile_id ?? null,
        source_language,
        target_language,
        texts,
        tm_mode,
        tm_threshold,
        tm_ids,
        glossary_ids,
        user_id: user_id ?? null,
        workspace: workspace ?? null,
      },
      { timeout: DAAIT_CONTENT_TIMEOUT_MS },
    );
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to translate with DAAIT");
  }
}

/**
 * LLM post-editing over (source, target) pairs. Response aligns one
 * SegmentResult per input pair (same order): { target, final_status, d_score,
 * detected_terms, missed_terms, llm_used, fallback_llm, tokens, ... }.
 * `use_term_score: true` makes DAAIT compute d_score + term lists even at
 * MEDIUM task level. memory_ids is opt-out (empty = all profile memories),
 * glossary_ids is opt-in (empty = none).
 */
export async function postEditContent({
  profile_id,
  alignments,
  task_level,
  use_term_score = true,
  memory_ids = [],
  glossary_ids = [],
  document_id,
  workspace_id,
  user_id,
  last_batch = false,
}) {
  try {
    const response = await daaitClient.post(
      "/content/post_edit",
      {
        profile_id,
        alignments,
        task_level: task_level ?? null,
        use_term_score,
        memory_ids,
        glossary_ids,
        document_id: document_id ?? null,
        workspace_id: workspace_id ?? null,
        user_id: user_id ?? null,
        last_batch,
      },
      { timeout: DAAIT_CONTENT_TIMEOUT_MS },
    );
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to post-edit with DAAIT");
  }
}

/*PROFILE API*/

export async function createProfile({
  id,
  name,
  description,
  instructions,
  formality,
  domain,
  source_language,
  target_language,
  task_level,
  params_autope,
  draft_mode = "PROFILE",
}) {
  try {
    const payload = {
      id,
      name,
      description: description ?? "",
      instructions: instructions ?? "",
      formality: formality ?? "",
      domain: domain ?? "",
      source_language: "und",
      target_language: "und",
      draft_mode,
    };
    // if (source_language) payload.source_language = source_language;
    // if (target_language) payload.target_language = target_language;
    if (task_level) payload.task_level = task_level;
    if (params_autope) payload.params_autope = params_autope;
    const response = await daaitClient.post("/profile", payload);
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to create DAAIT profile");
  }
}

// PATCH goes to the collection path with the id in the body (per the autope2
// OpenAPI; /profile/{id} only supports GET and DELETE).
export async function updateProfile({
  id,
  name,
  description,
  instructions,
  formality,
  domain,
  task_level,
  params_autope,
  draft_mode,
}) {
  try {
    const payload = { id };
    if (name !== undefined) payload.name = name;
    if (description !== undefined) payload.description = description ?? "";
    if (instructions !== undefined) payload.instructions = instructions ?? "";
    if (formality !== undefined) payload.formality = formality ?? "";
    if (domain !== undefined) payload.domain = domain ?? "";
    if (task_level !== undefined) payload.task_level = task_level;
    if (params_autope !== undefined) payload.params_autope = params_autope;
    if (draft_mode !== undefined) payload.draft_mode = draft_mode;
    const response = await daaitClient.patch("/profile", payload);
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to update DAAIT profile");
  }
}

// Attach/detach memories and glossaries to a profile mirror. CRITICAL for
// translation: /content/pecat and /content/post_edit resolve TMs/glossaries
// against the profile's attached resources — with a profile_id set, tm_ids
// only RESTRICT within that set, so an unattached memory is never matched.
export async function attachProfileResources(profileId, resourceIds) {
  if (!resourceIds?.length) return null;
  try {
    const response = await daaitClient.post("/profile/resources", {
      profile_id: profileId,
      resource_id: resourceIds,
    });
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to attach DAAIT profile resources");
  }
}

export async function detachProfileResources(profileId, resourceIds) {
  if (!resourceIds?.length) return null;
  try {
    const response = await daaitClient.delete("/profile/resources", {
      data: { profile_id: profileId, resource_id: resourceIds },
    });
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to detach DAAIT profile resources");
  }
}

export async function deleteProfile(id) {
  try {
    const response = await daaitClient.delete(
      `/profile/${encodeURIComponent(id)}`,
    );
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to delete DAAIT profile");
  }
}

/*GLOSSARY API*/

export async function createGlossary({
  id,
  source_language,
  target_language,
  owner,
  entries = [],
}) {
  try {
    const response = await daaitClient.post("/glossary", {
      id,
      source_language,
      target_language,
      owner,
      entries,
    });
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to create DAAIT glossary");
  }
}

export async function listGlossaries({ owner, page, size } = {}) {
  try {
    const response = await daaitClient.get("/glossary", {
      params: { owner, page, size },
      timeout: DAAIT_LIST_TIMEOUT_MS,
    });
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to list DAAIT glossaries");
  }
}

export async function importGlossary({
  file,
  id,
  owner,
  source_language,
  target_language,
}) {
  try {
    const form = new FormData();
    form.append(
      "file",
      await toFileBuffer(file),
      file?.name || "glossary.xlsx",
    );
    form.append("source_language", source_language);
    form.append("target_language", target_language);
    form.append("id", id);
    form.append("owner", owner);

    const response = await daaitClient.post("/glossary/import", form, {
      headers: form.getHeaders(),
    });
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to import DAAIT glossary");
  }
}

export async function getGlossary(id, { timeout } = {}) {
  try {
    const response = await daaitClient.get(
      `/glossary/${encodeURIComponent(id)}`,
      timeout ? { timeout } : undefined,
    );

    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to get DAAIT glossary");
  }
}

export async function exportGlossary(id, format = "csv") {
  try {
    const response = await daaitClient.get(
      `/glossary/${encodeURIComponent(id)}/export`,
      {
        params: { format },
        responseType: "arraybuffer",
        timeout: DAAIT_EXPORT_TIMEOUT_MS,
      },
    );
    return Buffer.from(response.data);
  } catch (error) {
    mapAndThrow(error, "Failed to export DAAIT glossary");
  }
}

export async function deleteGlossary(id) {
  try {
    const response = await daaitClient.delete(
      `/glossary/${encodeURIComponent(id)}`,
    );
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to delete DAAIT glossary");
  }
}

export async function getGlossaryEntries(id, { page, size, filter } = {}) {
  try {
    const response = await daaitClient.get(
      `/glossary/${encodeURIComponent(id)}/terms`,
      { params: { page, size, filter } },
    );
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to get DAAIT glossary entries");
  }
}

export async function addGlossaryEntries(id, entries) {
  try {
    const response = await daaitClient.post(
      `/glossary/${encodeURIComponent(id)}/terms`,
      { entries },
    );
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to add DAAIT glossary entries");
  }
}

export async function updateGlossaryEntry(id, entryId, entry) {
  try {
    const response = await daaitClient.put(
      `/glossary/${encodeURIComponent(id)}/terms/${encodeURIComponent(entryId)}`,
      entry,
    );
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to update DAAIT glossary entry");
  }
}

export async function deleteGlossaryEntry(id, entryId) {
  try {
    const response = await daaitClient.delete(
      `/glossary/${encodeURIComponent(id)}/terms/${encodeURIComponent(entryId)}`,
    );
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to delete DAAIT glossary entry");
  }
}
