import xml2js from "xml2js";
import {
  bulkIndexDocuments,
  deleteDocument,
  indexDocument,
  searchDocuments,
  updateDocument,
} from "../../lib/opensearch";
import { HttpError } from "../shared/http-error";

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

function mapSearchHitsToDocs(hits) {
  return hits.map((hit) => ({
    id: hit._id,
    ...hit._source,
  }));
}

function getTotalHits(searchResult, fallbackLength) {
  if (typeof searchResult?.hits?.total === "number") {
    return searchResult.hits.total;
  }

  return searchResult?.hits?.total?.value ?? fallbackLength;
}

function asOptionalTerm(field, value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return {
    term: {
      [field]: {
        value,
      },
    },
  };
}

export async function createTranslationMemoryService(payload) {
  const { name, user, project, domain, source, target } = payload;
  const doc = {
    name,
    context: { user, project, domain, source, target },
  };

  return indexDocument("translation_memory", doc);
}

export async function listTranslationMemoriesService(queryParams) {
  const { name, user, project, domain, source, target, size = 100 } = queryParams;

  const must = [
    asOptionalTerm("name", name),
    asOptionalTerm("context.user", user),
    asOptionalTerm("context.project", project),
    asOptionalTerm("context.domain", domain),
    asOptionalTerm("context.source", source),
    asOptionalTerm("context.target", target),
  ].filter(Boolean);

  const query = { bool: { must } };
  const parsedSize = Number.parseInt(size, 10) || 100;
  const response = await searchDocuments("translation_memory", { query }, parsedSize);
  const hits = response?.hits?.hits || [];
  const docs = mapSearchHitsToDocs(hits);

  return {
    total: getTotalHits(response, docs.length),
    docs,
  };
}

export async function updateTranslationMemoryService(payload) {
  const { id, name, project, domain } = payload;
  const doc = {};
  const context = {};

  if (name) {
    doc.name = name;
  }

  if (project) {
    context.project = project;
  }

  if (domain) {
    context.domain = domain;
  }

  if (Object.keys(context).length > 0) {
    doc.context = context;
  }

  if (Object.keys(doc).length === 0) {
    throw new HttpError(400, "No fields to update");
  }

  const result = await updateDocument("translation_memory", id, doc);
  return { message: "Updated successfully", result };
}

export async function deleteTranslationMemoryService(id) {
  const result = await deleteDocument("translation_memory", id);
  return { message: "Deleted successfully", result };
}

export async function getTranslationMemoryWithTusService(id) {
  const tmResponse = await searchDocuments(
    "translation_memory",
    {
      query: {
        ids: {
          values: [id],
        },
      },
    },
    1,
  );

  const tmHits = tmResponse?.hits?.hits || [];
  if (tmHits.length === 0) {
    throw new HttpError(404, "Translation memory not found");
  }

  const tm = {
    id,
    ...tmHits[0]._source,
  };

  const tusResponse = await searchDocuments(
    "translation_units",
    {
      query: {
        term: {
          translation_memory_id: {
            value: id,
          },
        },
      },
    },
    10000,
  );

  const tusHits = tusResponse?.hits?.hits || [];
  const tus = mapSearchHitsToDocs(tusHits);

  return {
    translation_memory: tm,
    units: tus,
  };
}

function hasValidTmId(tmId) {
  return tmId !== undefined && tmId !== null && String(tmId).trim() !== "" && String(tmId) !== "0";
}

export async function importTranslationMemoryService({ translation_memory, units, tmId }) {
  if (!translation_memory || !Array.isArray(units)) {
    throw new HttpError(400, "Invalid import structure");
  }

  let finalTmId = null;
  if (hasValidTmId(tmId)) {
    finalTmId = String(tmId);
  } else {
    const imported = await indexDocument(
      "translation_memory",
      {
        name: translation_memory.name,
        context: translation_memory.context,
      },
      translation_memory.id || undefined,
    );

    finalTmId = imported._id;
  }

  const now = new Date().toISOString();
  const bulkBody = units.flatMap((unit) => [
    { index: { _index: "translation_units" } },
    {
      ...unit,
      translation_memory_id: finalTmId,
      create_date: unit.create_date || now,
      update_date: unit.update_date || now,
    },
  ]);

  const bulkResponse = await bulkIndexDocuments(bulkBody);
  if (bulkResponse?.errors) {
    throw new HttpError(500, "Some translation units failed to import");
  }

  return {
    message: "TM and units imported successfully",
    translation_memory_id: finalTmId,
    units_imported: units.length,
  };
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
    return importTranslationMemoryService({
      tmId: tmxData.tmId,
      translation_memory: tmxData.translation_memory,
      units: tmxData.units,
    });
  }

  throw new HttpError(400, "No file uploaded");
}

export async function exportTmAsXmlService(tmId) {
  const data = await getTranslationMemoryWithTusService(tmId);
  return generateTMX(data);
}

