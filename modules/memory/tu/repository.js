import {
  addMemoryTus,
  deleteMemoryTu,
  getMemory,
  getMemoryTus,
  searchMemoryTus,
  updateMemoryTu,
} from "@/lib/daait";

export async function listTus(translationMemoryId, size = 10000) {
  return getMemoryTus(translationMemoryId, { size });
}

export async function listTusPage(
  translationMemoryId,
  { page = 1, size = 100 } = {},
) {
  return getMemoryTus(translationMemoryId, { page, size });
}

export async function listAllTus(translationMemoryId, size = 100) {
  let page = 1;
  let total = 0;
  const items = [];

  do {
    const response = await getMemoryTus(translationMemoryId, { page, size });
    const pageItems = response?.items ?? [];
    total = response?.total ?? items.length + pageItems.length;
    items.push(...pageItems);
    page += 1;

    if (pageItems.length === 0) break;
  } while (items.length < total);

  return { items, page: 1, size, total: total || items.length };
}

export async function createTu(translationMemoryId, tu) {
  return addMemoryTus(translationMemoryId, [tu]);
}

export async function updateTu(translationMemoryId, translationUnitId, tu) {
  return updateMemoryTu(translationMemoryId, translationUnitId, tu);
}

export async function deleteTu(translationMemoryId, translationUnitId) {
  return deleteMemoryTu(translationMemoryId, translationUnitId);
}

export async function getTmById(id) {
  return getMemory(id);
}

export async function searchTus(translationMemoryId, query) {
  return searchMemoryTus(translationMemoryId, query);
}

export async function appendTu(tmId, source, target) {
  return addMemoryTus(tmId, [
    {
      source,
      target,
    },
  ]);
}
