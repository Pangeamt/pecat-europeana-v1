import Joi from "joi";

export const importByUrlSchema = Joi.object({
  url: Joi.string().required(),
});

export const updateProjectSchema = Joi.object({
  label: Joi.string().required(),
  projectId: Joi.string().required(),
});

export const deleteProjectSchema = Joi.object({
  projectId: Joi.string().required(),
});

