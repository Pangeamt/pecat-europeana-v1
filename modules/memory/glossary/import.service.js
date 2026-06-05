import { HttpError } from "@/modules/shared/http-error";
import { deleteGlossaryDaait, importGlossaryDaait } from "./repository";
import { resolveGlossaryForImportService } from "./service";
import { hardDeleteGlossaryRecord } from "./prisma-repository";

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
