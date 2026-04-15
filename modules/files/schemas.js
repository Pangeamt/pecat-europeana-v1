import Joi from "joi";

export const fileShareParamsSchema = Joi.object({
  projectId: Joi.string().required(),
});

export const fileDownloadQuerySchema = Joi.object({
  uuid: Joi.string().required(),
  projectId: Joi.string().required(),
});

