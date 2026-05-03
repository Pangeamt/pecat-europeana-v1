import xml2js from "xml2js";
import { HttpError } from "@/modules/shared/http-error";

export async function parseTmxFile(file, userEmail, tmId) {
  const parser = new xml2js.Parser();
  const fileBuffer = await file.arrayBuffer();
  const xmlData = Buffer.from(fileBuffer).toString("utf-8");

  return new Promise((resolve, reject) => {
    parser.parseString(xmlData, (err, result) => {
      if (err) {
        reject(new HttpError(400, `Error parsing the file: ${err}`));
        return;
      }

      const translationMemory = result.tmx.header[0].$;
      const nameTMX = result.tmx.header[0].$.name || "Imported TMX";
      resolve({
        tmId,
        translation_memory: {
          name: nameTMX,
          context: {
            user: userEmail,
            project: "Proyecto123",
            domain: "Dominio",
            source: translationMemory.srclang,
            target: translationMemory.adminlang,
          },
        },
      });
    });
  });
}
