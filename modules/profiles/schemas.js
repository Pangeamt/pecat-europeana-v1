import Joi from "joi";

export const FORMALITY_VALUES = ["FORMAL", "NEUTRO", "INFORMAL"];
export const TASK_LEVEL_VALUES = ["BASIC", "MEDIUM", "ADVANCED"];

export const createProfileSchema = Joi.object({
  name: Joi.string().trim().min(1).max(191).required(),
  // Required by the DAAIT mirror (POST /profile rejects an empty description).
  description: Joi.string().trim().min(1).max(2000).required(),
  formality: Joi.string()
    .valid(...FORMALITY_VALUES)
    .optional(),
  instructions: Joi.string().trim().max(5000).optional().allow("", null),
  domain: Joi.string().trim().max(191).optional().allow("", null),
  sourceLanguage: Joi.string().trim().max(20).optional().allow("", null),
  // Required by the DAAIT mirror (BCP 47 tag).
  targetLanguage: Joi.string().trim().min(2).max(20).required(),
  taskLevel: Joi.string()
    .valid(...TASK_LEVEL_VALUES)
    .optional(),
  llmModels: Joi.object().optional().allow(null),
  workspaceId: Joi.string().optional().allow(null),
  tmIds: Joi.array().items(Joi.string()).optional().default([]),
  glossaryIds: Joi.array().items(Joi.string()).optional().default([]),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(1).max(191).optional(),
  description: Joi.string().trim().max(2000).optional().allow("", null),
  formality: Joi.string()
    .valid(...FORMALITY_VALUES)
    .optional(),
  instructions: Joi.string().trim().max(5000).optional().allow("", null),
  domain: Joi.string().trim().max(191).optional().allow("", null),
  // The language pair is immutable after creation (the DAAIT mirror cannot
  // change it via PATCH), so it is deliberately absent here.
  taskLevel: Joi.string()
    .valid(...TASK_LEVEL_VALUES)
    .optional(),
  llmModels: Joi.object().optional().allow(null),
  tmIds: Joi.array().items(Joi.string()).optional(),
  glossaryIds: Joi.array().items(Joi.string()).optional(),
});

export const listProfilesQuerySchema = Joi.object({
  workspaceId: Joi.string().optional().allow("", null),
});
