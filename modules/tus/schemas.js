import Joi from "joi";

export const updateTuSchema = Joi.object({
  tuId: Joi.string().required(),
  reviewLiteral: Joi.string().allow(null).optional(),
  action: Joi.string().required(),
  block: Joi.boolean().optional(),
  levenshteinDistance: Joi.number().optional(),
});
