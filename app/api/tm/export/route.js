import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import axios from "axios";
const TM_HOST = process.env.NEXT_PUBLIC_TM_HOST;

function generateTMX(data) {
    const { translation_memory, units } = data;
  
    const srcLang = translation_memory.context.source || 'en';
    const trgLang = translation_memory.context.target || 'es';
    const creationDate = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  
    const header = `<?xml version='1.0' encoding='utf-8'?>
  <tmx version="1.4b">
    <header
      srclang="${srcLang}"
      datatype="PlainText"
      segtype="sentence"
      creationtool="Custom TM Exporter"
      creationtoolversion="1.0"
      adminlang="${srcLang}"
      creationdate="${creationDate}"
      creationid="${translation_memory.context.user || 'System'}"
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
      .join('\n');
  
    const footer = `  </body>\n</tmx>`;
  
    return `${header}\n${tuEntries}\n${footer}`;
  }
  
  // Utilidad para escapar caracteres XML especiales
function escapeXml(str) {
return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const GET = async (req, { params }) => {
  try {
    const authValue = await getServerSession(authOptions);
    if (!authValue)
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    const { user } = authValue;
    if (!user)
      return Response.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tmID = searchParams.get("tmId");

    console.log(tmID);

    const response = await axios.get(`${TM_HOST}/tm/${tmID}/export`);
    const tmxContent = generateTMX(response.data);
    return new Response(tmxContent, {
        status: 200,
        headers: {
          "Content-Type": "application/xml",
          "Content-Disposition": `attachment; filename="${tmID}.tmx"`,
        },
      });

  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
};
