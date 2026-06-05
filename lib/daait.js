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

export async function getMemory(id) {
  try {
    const response = await daaitClient.get(`/memory/${encodeURIComponent(id)}`);
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
    });
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to list DAAIT memories");
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

export async function getGlossary(id) {
  try {
    const response = await daaitClient.get(
      `/glossary/${encodeURIComponent(id)}`,
    );

    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to get DAAIT glossary");
  }
}

export async function exportGlossary(id, format = "xlsx") {
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
      `/glossary/${encodeURIComponent(id)}/entries`,
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
      `/glossary/${encodeURIComponent(id)}/entries`,
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
      `/glossary/${encodeURIComponent(id)}/entries/${encodeURIComponent(entryId)}`,
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
      `/glossary/${encodeURIComponent(id)}/entries/${encodeURIComponent(entryId)}`,
    );
    return response.data;
  } catch (error) {
    mapAndThrow(error, "Failed to delete DAAIT glossary entry");
  }
}
