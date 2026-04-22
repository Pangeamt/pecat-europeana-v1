import { HttpError } from "@/modules/shared/http-error";
import { bulkInsertTus } from "./repository";
import { parseTmxFile } from "./tmx";
import { prepareTranslationMemoryForImportService } from "./service";

export async function importTranslationMemoryService({
  translation_memory,
  units,
  tmId,
  actorUser,
}) {
  if (!translation_memory || !Array.isArray(units)) {
    throw new HttpError(400, "Invalid import structure");
  }

  const finalTmId = await prepareTranslationMemoryForImportService({
    translation_memory,
    tmId,
    actorUser,
  });

  const now = new Date().toISOString();
  const bulkBody = units.flatMap((unit) => [
    { index: { _index: "translation_units" } },
    {
      ...unit,
      translation_memory_id: finalTmId,
      create_date: unit.create_date || now,
      update_date: unit.update_date || now,
    },
  ]);

  const bulkResponse = await bulkInsertTus(bulkBody);
  if (bulkResponse?.errors) {
    throw new HttpError(500, "Some translation units failed to import");
  }

  return {
    message: "TM and units imported successfully",
    translation_memory_id: finalTmId,
    units_imported: units.length,
  };
}

export async function importTmFromFilesService({
  files,
  tmId,
  userEmail,
  actorUser,
}) {
  for (const file of files) {
    if (!file || !file.name) continue;

    const fileName = file.name.trim().replace(/\s+/g, "");
    const fileExtension = fileName.split(".").pop().toLowerCase();
    if (fileExtension !== "tmx") {
      throw new HttpError(400, "The file type is not allowed");
    }

    const tmxData = await parseTmxFile(file, userEmail, tmId);
    return importTranslationMemoryService({
      tmId: tmxData.tmId,
      translation_memory: tmxData.translation_memory,
      units: tmxData.units,
      actorUser,
    });
  }

  throw new HttpError(400, "No file uploaded");
}
