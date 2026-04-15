import axios from "axios";
import xml2js from "xml2js";
import { HttpError } from "../shared/http-error";

const TM_HOST = process.env.NEXT_PUBLIC_TM_HOST;

async function parseTmxFile(file, userEmail, tmId) {
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
      const units = result.tmx.body[0].tu.map((tu) => ({
        source_language: tu.tuv[0].$["xml:lang"],
        target_language: tu.tuv[1].$["xml:lang"],
        source_text: tu.tuv[0].seg[0],
        translated_text: tu.tuv[1].seg[0],
        context: {
          user: userEmail,
          project: "Proyecto",
          domain: "Dominio",
        },
      }));

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
        units,
      });
    });
  });
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function generateTMX(data) {
  const { translation_memory, units } = data;
  const srcLang = translation_memory.context.source || "en";
  const trgLang = translation_memory.context.target || "es";
  const creationDate = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .split(".")[0];

  const header = `<?xml version='1.0' encoding='utf-8'?>
  <tmx version="1.4b">
    <header
      srclang="${srcLang}"
      datatype="PlainText"
      segtype="sentence"
      creationtool="Custom TM Exporter"
      creationtoolversion="1.0"
      adminlang="${trgLang}"
      creationdate="${creationDate}"
      creationid="${translation_memory.context.user || "System"}"
    />
    <body>`;

  const tuEntries = units
    .map((unit) => {
      const source = escapeXml(unit.source_text);
      const target = escapeXml(unit.translated_text);

      return `    <tu id="${unit.id}">
        <tuv xml:lang="${srcLang}">
          <seg>${source}</seg>
        </tuv>
        <tuv xml:lang="${trgLang}">
          <seg>${target}</seg>
        </tuv>
      </tu>`;
    })
    .join("\n");

  const footer = "  </body>\n</tmx>";
  return `${header}\n${tuEntries}\n${footer}`;
}

export async function importTmFromFilesService({ files, tmId, userEmail }) {
  for (const file of files) {
    if (!file || !file.name) continue;

    const fileName = file.name.trim().replace(/\s+/g, "");
    const fileExtension = fileName.split(".").pop().toLowerCase();
    if (fileExtension !== "tmx") {
      throw new HttpError(400, "The file type is not allowed");
    }

    const tmxData = await parseTmxFile(file, userEmail, tmId);
    const response = await axios.post(`${TM_HOST}/tm/import`, tmxData, {
      headers: { "Content-Type": "application/json" },
    });

    return response.data;
  }

  throw new HttpError(400, "No file uploaded");
}

export async function exportTmAsXmlService(tmId) {
  const response = await axios.get(`${TM_HOST}/tm/${tmId}/export`);
  return generateTMX(response.data);
}

