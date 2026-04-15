import Joi from "joi";

export const roleEnum = ["USER", "ADMIN"];

export const createUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  role: Joi.string()
    .valid(...roleEnum)
    .required(),
  image: Joi.string().allow(null, ""),
  password: Joi.string().required(),
});

export const updateUserSchema = Joi.object({
  userId: Joi.string().required(),
  name: Joi.string(),
  email: Joi.string().email(),
  role: Joi.string().valid(...roleEnum),
  image: Joi.string().allow(null, ""),
  password: Joi.string(),
});

