import { HttpError } from "@/modules/shared/http-error";
import { findTmRecordById } from "./prisma-repository";
import { exportTmDaait } from "./repository";

async function assertTmInWorkspace(id, actorUser) {
  const record = await findTmRecordById(id);
  if (!record) {
    throw new HttpError(404, "Translation memory not found");
  }

  if (
    actorUser.role !== "SUPER" &&
    record.workspaceId !== actorUser.workspaceId
  ) {
    throw new HttpError(403, "Translation memory not in your workspace");
  }

  return record;
}

export async function exportTmAsXmlService(tmId, actorUser, format = "tmx") {
  await assertTmInWorkspace(tmId, actorUser);
  return exportTmDaait(tmId, format);
}
