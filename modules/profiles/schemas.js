import Joi from "joi";

export const FORMALITY_VALUES = ["FORMAL", "NEUTRO", "INFORMAL"];

export const createProfileSchema = Joi.object({
  name: Joi.string().trim().min(1).max(191).required(),
  // Required by the DAAIT mirror (POST /profile rejects an empty description).
  description: Joi.string().trim().min(1).max(2000).required(),
  formality: Joi.string()
    .valid(...FORMALITY_VALUES)
    .optional(),
  instructions: Joi.string().trim().max(5000).optional().allow("", null),
  domain: Joi.string().trim().max(191).optional().allow("", null),
  // Profiles are language-agnostic: the pair always comes from the document
  // upload. (Legacy profiles may still carry a stored pair, which the
  // pipeline uses only as a mismatch guard.)
  // The pipeline level is DAAIT's (MEDIUM by default or the preset's): no
  // longer accepted, stripped so an older client never gets a 400.
  taskLevel: Joi.any().strip(),
  // Name of a DAAIT quality preset (GET /llm/presets); null/"" = none.
  llmPreset: Joi.string().trim().max(64).optional().allow(null, ""),
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
  taskLevel: Joi.any().strip(),
  // null/"" removes the preset.
  llmPreset: Joi.string().trim().max(64).optional().allow(null, ""),
  llmModels: Joi.object().optional().allow(null),
  tmIds: Joi.array().items(Joi.string()).optional(),
  glossaryIds: Joi.array().items(Joi.string()).optional(),
});

export const listProfilesQuerySchema = Joi.object({
  workspaceId: Joi.string().optional().allow("", null),
});
