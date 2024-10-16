import axios from "axios";
import contentDisposition from "content-disposition";
import fs from "fs";
import Joi from "joi";
import { getServerSession } from "next-auth";
import { pipeline } from "stream";
import { uid } from "uid";
import { promisify } from "util";
import zlib from "zlib";

import { authOptions } from "../../../lib/auth";
import prisma from "../../../lib/prisma";
import { checkFile, segmentTexts, translateTexts } from "../../../lib/utils";
import { oxygenTranslateFile } from "../../../lib/utils";

const pump = promisify(pipeline);

const schemaPUT = Joi.object({
  url: Joi.string().required(),
});

const schemaPATCH = Joi.object({
  label: Joi.string().required(),
  projectId: Joi.string().required(),
});

const schemaDELETE = Joi.object({
  projectId: Joi.string().required(),
});

export const GET = async () => {
  const authValue = await getServerSession(authOptions);
  if (!authValue)
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  const { user } = authValue;
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const where = {
    userId: user.id,
    deletedAt: null,
  };

  if (user.role === "ADMIN") {
    delete where.userId;
  }

  const projects = await prisma.project.findMany({
    where,
    select: {
      id: true,
      filename: true,
      mt: true,
      extension: true,
      createdAt: true,
      deletedAt: true,
      label: true,
      User: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  for (let i = 0; i < projects.length; i++) {
    const element = projects[i];
    const countByStatus = await prisma.tu.groupBy({
      by: ["Status"],
      _count: true,
      where: {
        projectId: element.id,
      },
    });
    const totalCount = await prisma.tu.count({
      where: {
        projectId: element.id,
      },
    });
    projects[i].countByStatus = countByStatus;
    projects[i].totalCount = totalCount;
  }

  return Response.json({
    total: projects.length,
    docs: projects,
  });
};

export const PUT = async (req) => {
  try {
    const body = await req.json();
    const value = await schemaPUT.validateAsync(body);
    const { url } = value;

    const authValue = await getServerSession(authOptions);
    if (!authValue)
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    const { user } = authValue;
    if (!user)
      return Response.json({ message: "Unauthorized" }, { status: 401 });

    let response = null;

    try {
      response = await axios({
        method: "get",
        url,
        responseType: "stream",
      });
    } catch (error) {
      return Response.json(
        { message: "The URL is not reachable" },
        { status: 500 }
      );
    }

    let fileName = "downloaded-file";
    const contentDispositionHeader = response.headers["content-disposition"];
    if (contentDispositionHeader) {
      fileName = contentDisposition.parse(contentDispositionHeader).parameters
        .filename;
    }

    // Crear carpeta
    const newFolder = new Date().getTime();
    const folderPath = `./public/files/${newFolder}`;
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    const downloadPath = `${folderPath}/${fileName}`;
    const writer = fs.createWriteStream(downloadPath);
    response.data.pipe(writer);

    // Esperar a que termine de escribirse el archivo
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const decompressedFilePath = `${downloadPath}.json`;

    // Descomprimir el archivo
    const readStream = fs.createReadStream(downloadPath);
    const writeStream = fs.createWriteStream(decompressedFilePath);
    const unzip = zlib.createGunzip();
    readStream.pipe(unzip).pipe(writeStream);

    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // Leer el archivo JSON
    const data = fs.readFileSync(decompressedFilePath, "utf8");
    const jsonData = JSON.parse(data);

    // Guardar el archivo en la DB
    const createOne = await prisma.project.create({
      data: {
        filename: fileName.trim(),
        userId: user.id,
        filePath: decompressedFilePath,
        extension: "json",
      },
    });

    // Guardar datos JSON en la DB
    await prisma.tu.createMany({
      data: jsonData.map((item) => ({
        ...item,
        projectId: createOne.id,
      })),
      skipDuplicates: true,
    });
    return Response.json({ status: "success" });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
};

export const PATCH = async (req) => {
  try {
    const body = await req.json();
    const value = await schemaPATCH.validateAsync(body);
    const { label, projectId } = value;

    const authValue = await getServerSession(authOptions);
    if (!authValue)
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    const { user } = authValue;
    if (!user)
      return Response.json({ message: "Unauthorized" }, { status: 401 });

    const file = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!file) {
      return Response.json({ message: "File not found" }, { status: 404 });
    }

    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        label,
      },
    });

    return Response.json({ status: "success" });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
};

export const DELETE = async (req) => {
  try {
    const body = await req.json();
    const value = await schemaDELETE.validateAsync(body);
    const { projectId } = value;

    const authValue = await getServerSession(authOptions);
    if (!authValue)
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    const { user } = authValue;
    if (!user)
      return Response.json({ message: "Unauthorized" }, { status: 401 });

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return Response.json({ message: "File not found" }, { status: 404 });
    }

    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return Response.json({ status: "success" });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
};

export const POST = async (req) => {
  try {
    const authValue = await getServerSession(authOptions);
    if (!authValue)
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    const { user } = authValue;
    if (!user)
      return Response.json({ message: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const files = formData.getAll("file");
    const mt = formData.get("mt") === "true";
    const src = formData.get("src");
    const tgt = formData.get("tgt");

    if (files.length === 0) {
      return Response.json({ message: "No file uploaded" }, { status: 400 });
    }

    for (const file of files) {
      if (file && file.name) {
        const fileName = file.name.trim().replace(/\s+/g, "");
        const fileExtension = fileName.split(".").pop().toLowerCase();

        if (!checkFile(file)) {
          return Response.json(
            {
              message: `The file type is not allowed`,
            },
            { status: 400 }
          );
        }

        const filePath = `./public/files/${uid()}_${file.name}`;
        await pump(file.stream(), fs.createWriteStream(filePath));
        let jsonData = null;
        let result = [];

        if (fileExtension === "json") {
          jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));

          let textsToSegment = {}; // Usaremos un objeto para agrupar los textos por idioma

          jsonData.forEach((item) => {
            if (!item.translatedLiteral) {
              if (
                !textsToSegment[`${item.sourceLanguage}-${item.targetLanguage}`]
              ) {
                textsToSegment[
                  `${item.sourceLanguage}-${item.targetLanguage}`
                ] = [];
              }
              textsToSegment[
                `${item.sourceLanguage}-${item.targetLanguage}`
              ].push(item);
            }
          });

          let segmentedTexts = {};
          let mtTexts = {};

          if (mt) {
            for (let language in textsToSegment) {
              const [srcLang] = language.split("-");
              segmentedTexts[language] = await segmentTexts(
                srcLang,
                textsToSegment[language].map((item) => item.srcLiteral)
              );

              for (let language1 in segmentedTexts) {
                const [srcLang, tgtLang] = language1.split("-");
                const aux = [];

                segmentedTexts[language1].segments.forEach((segment, index) => {
                  segment.forEach((s) => {
                    aux.push(
                      textsToSegment[language1][index].srcLiteral
                        .substring(s.start, s.stop)
                        .trim()
                    );
                  });
                });

                mtTexts[language1] = await translateTexts(
                  srcLang,
                  tgtLang,
                  aux
                );
              }
            }
          }

          let segmentIndices = {}; // Para mantener el índice de cada idioma

          jsonData.forEach((item) => {
            if (!item.translatedLiteral) {
              let language = `${item.sourceLanguage}-${item.targetLanguage}`;
              if (!segmentIndices[language]) {
                segmentIndices[language] = 0;
              }

              let segments =
                segmentedTexts[language].segments[segmentIndices[language]];
              segmentIndices[language]++;

              segments.forEach((segment, index) => {
                const aux = {
                  ...item,
                  id: `${item.id}-${index}`,
                  srcLiteral: item.srcLiteral
                    .substring(segment.start, segment.stop)
                    .trim(),
                  belongTo: item.id,
                  Status: "TRANSLATED_MT",
                  translatedLiteral: mt
                    ? mtTexts[language].translations[index].tgt
                    : null,
                  translationScorePercent: mt
                    ? mtTexts[language].translations[index].score
                    : null,
                };
                result.push(aux);
              });
            } else {
              result.push(item); // Si no se segmenta, se añade el objeto original
            }
          });
        } else {
          const tmp = await oxygenTranslateFile({
            filePath,
            src_lang: src || "en",
            tgt_lang: tgt || null,
            mt,
          });

          result = tmp.map((item, index) => ({
            externalId: null,
            count: index,
            srcLiteral: item.src,
            translatedLiteral: item.tgt,
            sourceLanguage: src,
            targetLanguage: tgt,
            Status: "NOT_REVIEWED",
          }));
        }

        const createOne = await prisma.project.create({
          data: {
            filename: file.name.trim(),
            userId: user.id,
            filePath,
            mt,
            extension: fileExtension,
            sourceLanguage: src,
            targetLanguage: tgt,
          },
        });

        const data = result.map((item) => {
          delete item.id;
          return {
            ...item,
            projectId: createOne.id,
          };
        });

        await prisma.tu.createMany({
          data,
        });
      }
    }
    return Response.json({ status: "success" });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
};
