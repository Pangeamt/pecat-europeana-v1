import Joi from "joi";

export const documentShareParamsSchema = Joi.object({
  projectId: Joi.string().required(),
});

export const documentDownloadQuerySchema = Joi.object({
  uuid: Joi.string().required(),
  projectId: Joi.string().required(),
});
