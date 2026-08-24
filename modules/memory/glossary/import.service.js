import { HttpError } from "@/modules/shared/http-error";
import { MEMORY_ASSET_STATUS } from "../status";
import { deleteGlossaryDaait, importGlossaryDaait } from "./repository";
import { resolveGlossaryForImportService } from "./service";
import {
  hardDeleteGlossaryRecord,
  updateGlossaryStatusRecord,
} from "./prisma-repository";

const ALLOWED_IMPORT_EXTENSIONS = ["tmx", "csv", "tsv"];

export async function importGlossaryFromFilesService({
  files,
  glossaryId,
  form,
  actorUser,
}) {
  for (const file of files) {
    if (!file || !file.name) continue;

    const fileName = file.name.trim().replace(/\s+/g, "");
    const fileExtension = fileName.split(".").pop().toLowerCase();
    if (!ALLOWED_IMPORT_EXTENSIONS.includes(fileExtension)) {
      throw new HttpError(
        400,
        "The file type is not allowed. Use TMX, CSV or TSV.",
      );
    }

    const { record, created } = await resolveGlossaryForImportService({
      glossaryId,
      form,
      actorUser,
    });

    try {
      const result = await importGlossaryDaait({
        file,
        id: record.id,
        owner: record.workspaceId,
        source_language: record.sourceLanguage,
        target_language: record.targetLanguage,
      });

      // Re-importing rebuilds the glossary in DAAIT: leave the local status
      // non-final so the status worker polls it until SUCCESS/FAILED.
      await updateGlossaryStatusRecord(
        record.id,
        result?.status ?? MEMORY_ASSET_STATUS.IN_PROGRESS,
      );

      return {
        message: "Glossary import scheduled successfully",
        glossary_id: record.id,
        result,
      };
    } catch (error) {
      if (created) {
        await Promise.all([
          hardDeleteGlossaryRecord(record.id).catch(() => {}),
          deleteGlossaryDaait(record.id).catch(() => {}),
        ]);
      }
      throw error;
    }
  }

  throw new HttpError(400, "No file uploaded");
}
