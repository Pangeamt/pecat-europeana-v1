import Joi from "joi";

export const createProjectSchema = Joi.object({
  name: Joi.string().trim().min(1).max(191).required(),
  description: Joi.string().trim().max(2000).optional().allow("", null),
  profileId: Joi.string().optional().allow(null),
  // The TM match threshold was removed (DAAIT decides which memories apply);
  // still accepted and dropped so a client with the old form never gets a 400.
  threshold: Joi.any().strip(),
  // Post-translation pipeline defaults for the project's documents
  // (Project.settings JSON; see modules/documents/pipeline-constants.js).
  mtqeThreshold: Joi.number().min(0).max(1).optional(),
  llmJudge: Joi.boolean().optional(),
  llmSuggest: Joi.boolean().optional(),
});

export const updateProjectSchema = Joi.object({
  name: Joi.string().trim().min(1).max(191).optional(),
  description: Joi.string().trim().max(2000).optional().allow("", null),
  // null detaches the profile (new documents then start without TM/glossary
  // defaults and the LLM review stage is skipped).
  profileId: Joi.string().optional().allow(null),
  threshold: Joi.any().strip(),
  mtqeThreshold: Joi.number().min(0).max(1).optional(),
  llmJudge: Joi.boolean().optional(),
  llmSuggest: Joi.boolean().optional(),
});
