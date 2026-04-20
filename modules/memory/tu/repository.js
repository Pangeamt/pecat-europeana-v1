import {
  getDocument,
  indexDocument,
  searchDocuments,
  updateDocument,
} from "@/lib/opensearch";

const TM_INDEX = "translation_memory";
const TU_INDEX = "translation_units";

export async function searchTus(queryBody, size = 1000) {
  return searchDocuments(TU_INDEX, queryBody, size);
}

export async function createTu(doc) {
  return indexDocument(TU_INDEX, doc);
}

export async function updateTu(id, partialDoc) {
  return updateDocument(TU_INDEX, id, partialDoc);
}

export async function getTuById(id) {
  return getDocument(TU_INDEX, id);
}

export async function getTmById(id) {
  return getDocument(TM_INDEX, id);
}
