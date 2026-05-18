import Joi from "joi";

const boolString = Joi.boolean()
  .truthy("true")
  .truthy("1")
  .falsy("false")
  .falsy("0");

export const tuSearchQuerySchema = Joi.object({
  translation_memory_id: Joi.string().required(),
  source_language: Joi.string().required(),
  target_language: Joi.string().required(),
  source_text: Joi.string().required(),
  user: Joi.string().optional().allow(null, ""),
  project: Joi.string().optional().allow(null, ""),
  domain: Joi.string().optional().allow(null, ""),
  perTerm: boolString.optional().default(false),
  minSimilarity: Joi.number().min(0).max(1).optional(),
});

export const tuAllQuerySchema = Joi.object({
  translation_memory_id: Joi.string().required(),
  page: Joi.number().integer().min(1).optional().default(1),
  size: Joi.number().integer().min(1).max(500).optional().default(100),
});

export const createTuSchema = Joi.object({
  translation_memory_id: Joi.string().required(),
  source_language: Joi.string().required(),
  target_language: Joi.string().required(),
  source_text: Joi.string().required(),
  translated_text: Joi.string().required(),
  user: Joi.string().optional().allow(null, ""),
  project: Joi.string().optional().allow(null, ""),
  domain: Joi.string().optional().allow(null, ""),
});

export const appendTuSchema = Joi.object({
  tmIds: Joi.array().items(Joi.string()).required(),
  source: Joi.string().required(),
  target: Joi.string().required(),
});

export const updateTuSchema = Joi.object({
  translation_unit_id: Joi.string().required(),
  translation_memory_id: Joi.string().required(),
  source_language: Joi.string().required(),
  target_language: Joi.string().required(),
  source_text: Joi.string().required(),
  translated_text: Joi.string().required(),
  user: Joi.string().optional().allow(null, ""),
  project: Joi.string().optional().allow(null, ""),
  domain: Joi.string().optional().allow(null, ""),
});

export const deleteTuSchema = Joi.object({
  translation_unit_id: Joi.string().required(),
  translation_memory_id: Joi.string().required(),
});
