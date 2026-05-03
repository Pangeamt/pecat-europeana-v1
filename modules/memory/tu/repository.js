import {
  addMemoryTus,
  deleteMemoryTu,
  getMemory,
  getMemoryTus,
  updateMemoryTu,
} from "@/lib/daait";

export async function listTus(translationMemoryId, size = 10000) {
  return getMemoryTus(translationMemoryId, { size });
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
