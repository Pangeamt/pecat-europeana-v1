import Joi from "joi";

export const createTmSchema = Joi.object({
  name: Joi.string().required(),
  user: Joi.string().required(),
  project: Joi.string().optional().allow("", null),
  domain: Joi.string().optional().allow("", null),
  source: Joi.string().required(),
  target: Joi.string().required(),
});

export const listTmQuerySchema = Joi.object({
  name: Joi.string().optional().allow("", null),
  user: Joi.string().required(),
  project: Joi.string().optional().allow("", null),
  domain: Joi.string().optional().allow("", null),
  source: Joi.string().optional().allow("", null),
  target: Joi.string().optional().allow("", null),
  size: Joi.alternatives()
    .try(Joi.number(), Joi.string(), Joi.valid(null))
    .optional(),
});

export const updateTmSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().optional().allow("", null),
  project: Joi.string().optional().allow("", null),
  domain: Joi.string().optional().allow("", null),
});

export const tmExportQuerySchema = Joi.object({
  tmId: Joi.string().required(),
});

export const tmImportFormSchema = Joi.object({
  tmId: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
});
