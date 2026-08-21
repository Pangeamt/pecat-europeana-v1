import Joi from "joi";

export const updateDocumentSchema = Joi.object({
  label: Joi.string().required(),
});

export const updateDocumentTmsSchema = Joi.object({
  updateTmIds: Joi.array().items(Joi.string()).required(),
});

export const assignDocumentUserSchema = Joi.object({
  role: Joi.string().valid("translator", "reviewer").required(),
  userId: Joi.string().allow(null).required(),
});
