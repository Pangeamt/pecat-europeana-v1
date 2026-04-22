import Joi from "joi";

export const createWorkspaceSchema = Joi.object({
  name: Joi.string().trim().min(1).max(191).required(),
});

export const updateWorkspaceSchema = Joi.object({
  name: Joi.string().trim().min(1).max(191).required(),
});

export const assignMemberSchema = Joi.object({
  userId: Joi.string().required(),
});
