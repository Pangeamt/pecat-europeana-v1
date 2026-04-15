import Joi from "joi";

export const tmExportQuerySchema = Joi.object({
  tmId: Joi.string().required(),
});

export const tmImportFormSchema = Joi.object({
  tmId: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
});

