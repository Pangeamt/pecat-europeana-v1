// import axios from "axios";
// import contentDisposition from "content-disposition";
// import fs from "fs";
// import Joi from "joi";
// import { getServerSession } from "next-auth";
// import { pipeline } from "stream";
// import { uid } from "uid";
// import { promisify } from "util";
// import zlib from "zlib";

// import { authOptions } from "../../../../lib/auth";


// const pump = promisify(pipeline);


// export const POST = async (req) => {
//   try {
//     const authValue = await getServerSession(authOptions);
//     if (!authValue) return Response.json({ message: "Unauthorized" }, { status: 401 });
//     const { user } = authValue;
//     if (!user)  return Response.json({ message: "Unauthorized" }, { status: 401 });

//     const formData = await req.formData();
//     const files = formData.getAll("file");


//     if (files.length === 0) return Response.json({ message: "No file uploaded" }, { status: 400 });
    
//     for (const file of files) {
//       if (file && file.name) {
//         const fileName = file.name.trim().replace(/\s+/g, "");
//         const fileExtension = fileName.split(".").pop().toLowerCase();

//         if (fileExtension !== "tmx") return Response.json({message: `The file type is not allowed`},{ status: 400 } );
        


//       }
//     }
//     return Response.json({ status: "success" });
//   } catch (error) {
//     return Response.json({ message: error.message }, { status: 500 });
//   }
// };


import axios from "axios";
import xml2js from "xml2js";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
const TM_HOST = process.env.NEXT_PUBLIC_TM_HOST;

// Función para parsear el archivo TMX y extraer los datos
const parseTmxFile = async (file, user) => {
  const parser = new xml2js.Parser();
  const fileBuffer = await file.arrayBuffer();
  const xmlData = Buffer.from(fileBuffer).toString("utf-8");

  return new Promise((resolve, reject) => {
    parser.parseString(xmlData, (err, result) => {
      if (err) reject(err);

      const translationMemory = result.tmx.header[0].$;


      const units = result.tmx.body[0].tu.map((tu) => {
        return {
            source_language: tu.tuv[0].$['xml:lang'],  // Acceder al atributo xml:lang
            target_language: tu.tuv[1].$['xml:lang'], 
            source_text: tu.tuv[0].seg[0],
            translated_text: tu.tuv[1].seg[0],
            context: {
                user: user, // Este sería el usuario real, obtenido de tu sesión
                project: "Proyecto",
                domain: "Dominio"
            }
        };
      });

      const nameTMX = result.tmx.header[0].$.name || "Imported TMX";

      const tm = {
        translation_memory: {
          name: nameTMX,
          context: {
            user: user, // Este sería el usuario real, obtenido de tu sesión
            project: "Proyecto123",
            domain: "Dominio",
            source: translationMemory.srclang,
            target: translationMemory.adminlang
          }
        },
        units: units
      };

      resolve(tm);
    });
  });
};

export const POST = async (req) => {
  try {
    const authValue = await getServerSession(authOptions);
    if (!authValue) return Response.json({ message: "Unauthorized" }, { status: 401 });
    const { user } = authValue;
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const files = formData.getAll("file");

    if (files.length === 0) return Response.json({ message: "No file uploaded" }, { status: 400 });
    
    for (const file of files) {
      if (file && file.name) {
        const fileName = file.name.trim().replace(/\s+/g, "");
        const fileExtension = fileName.split(".").pop().toLowerCase();

        console.log(fileExtension);
        if (fileExtension !== "tmx") {
            console.log("The file type is not allowed", fileExtension);
          return Response.json({ message: `The file type is not allowed` }, { status: 400 });
        }

        // Parsear el archivo TMX
        const tmxData = await parseTmxFile(file, user.email);

        // Enviar los datos al backend de Fastify
        const response = await axios.post(`${TM_HOST}/tm/import`, tmxData, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        return Response.json({ status: "success", data: response.data });
      }
    }

  } catch (error) {
    console.log(error);
    return Response.json({ message: error.message }, { status: 500 });
  }
};
