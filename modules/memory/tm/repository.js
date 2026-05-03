import {
  createMemory,
  deleteMemory,
  exportMemory,
  importMemoryTmx,
  listMemories,
} from "@/lib/daait";

export async function createTmWithIdDaait(id, doc) {
  return createMemory({
    id,
    owner: doc.owner,
    source_language: doc.source_language,
    target_language: doc.target_language,
    tus: doc.tus ?? [],
  });
}

export async function listTmsDaait({ owner, page, size } = {}) {
  return listMemories({ owner, page, size });
}

export async function deleteTmDaait(id) {
  return deleteMemory(id);
}

export async function importTmxDaait(payload) {
  return importMemoryTmx(payload);
}

export async function exportTmDaait(id, format = "tmx") {
  return exportMemory(id, format);
}
