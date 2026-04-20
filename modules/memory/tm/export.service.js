import { generateTMX } from "./tmx";
import { getTranslationMemoryWithTusService } from "./service";

export async function exportTmAsXmlService(tmId) {
  const data = await getTranslationMemoryWithTusService(tmId);
  return generateTMX(data);
}
