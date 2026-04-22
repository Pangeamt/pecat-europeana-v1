import { generateTMX } from "./tmx";
import { getTranslationMemoryWithTusService } from "./service";

export async function exportTmAsXmlService(tmId, actorUser) {
  const data = await getTranslationMemoryWithTusService(tmId, actorUser);
  return generateTMX(data);
}
