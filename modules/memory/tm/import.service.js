import { HttpError } from "@/modules/shared/http-error";
import { deleteTmDaait, importTmxDaait } from "./repository";
import { resolveTranslationMemoryForImportService } from "./service";
import { hardDeleteTmRecord } from "./prisma-repository";

export async function importTmFromFilesService({
  files,
  tmId,
  form,
  actorUser,
}) {
  for (const file of files) {
    if (!file || !file.name) continue;

    const fileName = file.name.trim().replace(/\s+/g, "");
    const fileExtension = fileName.split(".").pop().toLowerCase();
    if (fileExtension !== "tmx") {
      throw new HttpError(400, "The file type is not allowed");
    }

    const { record, created } = await resolveTranslationMemoryForImportService({
      tmId,
      form,
      actorUser,
    });

    try {
      const result = await importTmxDaait({
        file,
        id: record.id,
        owner: record.workspaceId,
        source_language: record.sourceLanguage,
        target_language: record.targetLanguage,
      });

      return {
        message: "TMX import scheduled successfully",
        translation_memory_id: record.id,
        result,
      };
    } catch (error) {
      if (created) {
        await Promise.all([
          hardDeleteTmRecord(record.id).catch(() => {}),
          deleteTmDaait(record.id).catch(() => {}),
        ]);
      }
      throw error;
    }
  }

  throw new HttpError(400, "No file uploaded");
}
