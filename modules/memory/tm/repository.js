import {
  bulkIndexDocuments,
  deleteDocument,
  indexDocument,
  searchDocuments,
  updateDocument,
} from "@/lib/opensearch";

const TM_INDEX = "translation_memory";
const TU_INDEX = "translation_units";

export async function createTm(doc) {
  return indexDocument(TM_INDEX, doc);
}

export async function searchTmsOpenSearch(query, size = 100) {
  return searchDocuments(TM_INDEX, { query }, size);
}

export async function updateTmOpenSearch(id, partialDoc) {
  return updateDocument(TM_INDEX, id, partialDoc);
}

export async function deleteTmOpenSearch(id) {
  return deleteDocument(TM_INDEX, id);
}

export async function findTmByIdOpenSearch(id) {
  return searchDocuments(TM_INDEX, { query: { ids: { values: [id] } } }, 1);
}

export async function createTmWithIdOpenSearch(id, doc) {
  return indexDocument(TM_INDEX, doc, id);
}

export async function searchTusByMemoryIdOpenSearch(
  translationMemoryId,
  size = 10000,
) {
  return searchDocuments(
    TU_INDEX,
    {
      query: {
        term: { translation_memory_id: { value: translationMemoryId } },
      },
    },
    size,
  );
}

export async function bulkInsertTusOpenSearch(bulkBody) {
  return bulkIndexDocuments(bulkBody);
}
