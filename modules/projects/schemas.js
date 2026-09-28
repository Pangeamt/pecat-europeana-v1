import Joi from "joi";

export const createProjectSchema = Joi.object({
  name: Joi.string().trim().min(1).max(191).required(),
  description: Joi.string().trim().max(2000).optional().allow("", null),
  // Documents are always translated with a profile — at least the default.
  profileId: Joi.string().required(),
  // Extra profiles also valid for this project, on top of profileId (the
  // default). Documents pick one of these at upload time.
  profileIds: Joi.array().items(Joi.string()).optional(),
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
  // null detaches the profile: the project keeps its documents but cannot
  // receive new ones until a profile is assigned again (409 PROFILE_REQUIRED).
  profileId: Joi.string().optional().allow(null),
  // Full replacement of the assigned-profile set when provided. See
  // createProjectSchema.profileIds.
  profileIds: Joi.array().items(Joi.string()).optional(),
  threshold: Joi.any().strip(),
  mtqeThreshold: Joi.number().min(0).max(1).optional(),
  llmJudge: Joi.boolean().optional(),
  llmSuggest: Joi.boolean().optional(),
});
