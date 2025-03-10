import { oxygenBuildFile, segmentTexts } from "../../../lib/utils";
import { createGzip } from "zlib";
import fs from "fs";
import path from "path";
import { pipeline } from "stream";
import prisma from "../../../lib/prisma";
import { promisify } from "util";
// import { uid } from "uid";

const pipelineAsync = promisify(pipeline);
const unlinkAsync = promisify(fs.unlink);

function combineAndRemove(array) {
  const combined = {};

  array.forEach((obj) => {
    if (obj.belongTo) {
      if (combined[obj.belongTo]) {
        combined[obj.belongTo].srcLiteral += " " + obj.srcLiteral;
        combined[obj.belongTo].translatedLiteral += " " + obj.translatedLiteral;
      } else {
        const aux = {
          ...obj,
          id: obj.belongTo,
          srcLiteral: obj.srcLiteral,
          translatedLiteral: obj.translatedLiteral,
          translationScorePercent: null,
        };
        combined[obj.belongTo] = {
          ...aux,
        };
      }
    }
  });

  const filtered = array.filter((obj) => !obj.belongTo);

  for (let key in combined) {
    delete combined[key].belongTo;
    filtered.push(combined[key]);
  }

  return filtered;
}

export const GET = async (req) => {
  try {
    // const url = new URL(req.url);
    // const searchParams = new URLSearchParams(url.searchParams);
    // const uuid = searchParams.get("uuid");
    // const projectId = searchParams.get("projectId");
    const { uuid, projectId } = Object.fromEntries( new URL( req.url ).searchParams );
    const now = new Date();

    if ( !uuid || !projectId ) return new Response(JSON.stringify({ message: "uuid or projectId is required" }), { status: 400 });
  
    const project = await prisma.project.findUnique({
      where: { id : projectId ?? undefined }
    });

    if ( !project && project.uuid !== uuid ) return new Response(JSON.stringify({ message: "Project not found" }), { status: 404 });
    
    const accessDeadline = new Date(project.accessDeadline);

    if ( accessDeadline < now ) return new Response(JSON.stringify({ message: "The link has expired" }), { status: 401 });
    
    const tus = await prisma.tu.findMany({
      where: { projectId: project.id ?? undefined },
    });

    const tusCombined = combineAndRemove(tus);

    if ( project.extension === "json") 
    {
      const jsonString = JSON.stringify(tusCombined);

      const fileNameAux = project.filename.split(".json")[0];
      const aux = new Date().getTime();
      const jsonFilePath = path.resolve(
        `./public/files/downloads/${fileNameAux}-${aux}-pecat.json`
      );
      const gzFilePath = path.resolve(
        `./public/files/downloads/${fileNameAux}-${aux}-pecat.json.gz`
      );

      await fs.promises.writeFile(jsonFilePath, jsonString);

      await pipelineAsync(
        fs.createReadStream(jsonFilePath),
        createGzip(),
        fs.createWriteStream(gzFilePath)
      );

      const fileBuffer = await fs.promises.readFile(gzFilePath);

      // Programar la eliminación del archivo después de un breve retraso para asegurar que la respuesta se haya enviado
      setTimeout(async () => {
        try {
          await unlinkAsync(jsonFilePath);
          await unlinkAsync(gzFilePath);
        } catch (err) {
          console.error("Error deleting temporary files:", err);
        }
      }, 5000); // 5 segundos de retraso

      return new Response(fileBuffer, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename=${fileNameAux}-pecat.json.gz`,
        },
      });
    } 
    else 
    {
      const tgts = tusCombined.map((tu) =>
        tu.reviewLiteral ? tu.reviewLiteral : tu.translatedLiteral || ""
      );
      
      const data = await oxygenBuildFile({
        tgts,
        src_lang: project.sourceLanguage,
        tgt_lang: project.targetLanguage,
        filePath: project.filePath,
      });

      return new Response(Buffer.from(data), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename=${project.filename}`,
        },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};

export const POST = async (req) => {
  try {
    const segmentedTexts = await segmentTexts("en", [
      "The video shows the first five minutes of the film. Film content: In the 17th century on Grieshuus Palace in Holstein: The old Burgherr has designated his son Hinrich as heir, while the younger son Detlef is studying law in the city. One day, Bärbe, the daughter of the serf Owe Heiken is attacked by soldiers, Hinrich can save her. He falls in love with her and wants to marry her against the will of the father. But during this dispute the father dies. Now the struggle between the unequal brothers for the inheritance begins. Detlef claims Grieshuus and tries to get Hinrich and Bärbe apart. Bärbe, who is pregnant, gives birth to the child too soon due to the excitement and dies. Hinrich then strikes the brother and flees. The young son is lovingly raised by the servant. However, Gesine, Detlef’s widow, repeatedly tries to tear Grieshuus. Hinrich returns to his homeland unrecognized and succeeds in liberating his child from the hands of Gesine.",
    ]);
    return Response.json({
      texts: segmentedTexts,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
};
