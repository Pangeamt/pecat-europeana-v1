import Joi from "joi";

export const createGlossarySchema = Joi.object({
  name: Joi.string().required(),
  user: Joi.string().optional().allow("", null),
  project: Joi.string().optional().allow("", null),
  domain: Joi.string().optional().allow("", null),
  source: Joi.string().required(),
  target: Joi.string().required(),
  workspaceId: Joi.string().optional().allow(null),
});

export const listGlossaryQuerySchema = Joi.object({
  name: Joi.string().optional().allow("", null),
  user: Joi.string().optional().allow("", null),
  project: Joi.string().optional().allow("", null),
  domain: Joi.string().optional().allow("", null),
  source: Joi.string().optional().allow("", null),
  target: Joi.string().optional().allow("", null),
  workspaceId: Joi.string().optional().allow("", null),
  size: Joi.alternatives()
    .try(Joi.number(), Joi.string(), Joi.valid(null))
    .optional(),
});

export const updateGlossarySchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().optional().allow("", null),
  project: Joi.string().optional().allow("", null),
  domain: Joi.string().optional().allow("", null),
});

export const glossaryExportQuerySchema = Joi.object({
  glossaryId: Joi.string().required(),
  format: Joi.string().valid("tmx", "csv", "tsv").optional().default("csv"),
});

export const glossaryImportFormSchema = Joi.object({
  glossaryId: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
  name: Joi.string().optional().allow("", null),
  project: Joi.string().optional().allow("", null),
  domain: Joi.string().optional().allow("", null),
  source: Joi.string().optional().allow("", null),
  target: Joi.string().optional().allow("", null),
});

export const glossaryEntriesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  size: Joi.number().integer().min(1).max(500).optional().default(100),
  filter: Joi.string().optional().allow("", null),
});
