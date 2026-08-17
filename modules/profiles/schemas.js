import Joi from "joi";

export const FORMALITY_VALUES = ["FORMAL", "NEUTRO", "INFORMAL"];

export const createProfileSchema = Joi.object({
  name: Joi.string().trim().min(1).max(191).required(),
  description: Joi.string().trim().max(2000).optional().allow("", null),
  formality: Joi.string()
    .valid(...FORMALITY_VALUES)
    .optional(),
  instructions: Joi.string().trim().max(5000).optional().allow("", null),
  domain: Joi.string().trim().max(191).optional().allow("", null),
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
  tmIds: Joi.array().items(Joi.string()).optional(),
  glossaryIds: Joi.array().items(Joi.string()).optional(),
});

export const listProfilesQuerySchema = Joi.object({
  workspaceId: Joi.string().optional().allow("", null),
});
