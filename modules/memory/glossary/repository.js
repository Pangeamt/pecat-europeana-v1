import {
  createGlossary,
  deleteGlossary,
  exportGlossary,
  getGlossary,
  getGlossaryEntries,
  importGlossary,
  listGlossaries,
  addGlossaryEntries,
  updateGlossaryEntry,
  deleteGlossaryEntry,
} from "@/lib/daait";

export async function createGlossaryWithIdDaait(id, doc) {
  return createGlossary({
    id,
    owner: doc.owner,
    source_language: doc.source_language,
    target_language: doc.target_language,
    entries: doc.entries ?? [],
  });
}

export async function listGlossariesDaait({ owner, page, size } = {}) {
  return listGlossaries({ owner, page, size });
}

export async function getGlossaryDaait(id) {
  return getGlossary(id);
}

export async function deleteGlossaryDaait(id) {
  return deleteGlossary(id);
}

export async function importGlossaryDaait(payload) {
  return importGlossary(payload);
}

export async function exportGlossaryDaait(id, format = "csv") {
  return exportGlossary(id, format);
}

export async function listGlossaryEntriesDaait(id, { page, size, filter } = {}) {
  return getGlossaryEntries(id, { page, size, filter });
}

export async function addGlossaryEntryDaait(id, entries) {
  return addGlossaryEntries(id, entries);
}

export async function updateGlossaryEntryDaait(id, entryId, entry) {
  return updateGlossaryEntry(id, entryId, entry);
}

export async function deleteGlossaryEntryDaait(id, entryId) {
  return deleteGlossaryEntry(id, entryId);
}
