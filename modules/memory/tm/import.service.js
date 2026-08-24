import { HttpError } from "@/modules/shared/http-error";
import { MEMORY_ASSET_STATUS } from "../status";
import { deleteTmDaait, importTmxDaait } from "./repository";
import { resolveTranslationMemoryForImportService } from "./service";
import { hardDeleteTmRecord, updateTmStatusRecord } from "./prisma-repository";

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

      // Re-importing rebuilds the TM in DAAIT: leave the local status
      // non-final so the status worker polls it until SUCCESS/FAILED.
      await updateTmStatusRecord(
        record.id,
        result?.status ?? MEMORY_ASSET_STATUS.IN_PROGRESS,
      );

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
