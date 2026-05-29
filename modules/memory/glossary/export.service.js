import { HttpError } from "@/modules/shared/http-error";
import { findGlossaryRecordById } from "./prisma-repository";
import { exportGlossaryDaait } from "./repository";

async function assertGlossaryInWorkspace(id, actorUser) {
  const record = await findGlossaryRecordById(id);
  if (!record) {
    throw new HttpError(404, "Glossary not found");
  }

  if (
    actorUser.role !== "SUPER" &&
    record.workspaceId !== actorUser.workspaceId
  ) {
    throw new HttpError(403, "Glossary not in your workspace");
  }

  return record;
}

export async function exportGlossaryAsXlsxService(
  glossaryId,
  actorUser,
  format = "xlsx",
) {
  await assertGlossaryInWorkspace(glossaryId, actorUser);
  return exportGlossaryDaait(glossaryId, format);
}
