import Joi from "joi";

export const roleEnum = ["USER", "ADMIN", "SUPER"];

export const languageEnum = ["en", "es"];

export const createUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  role: Joi.string()
    .valid(...roleEnum)
    .required(),
  image: Joi.string().allow(null, ""),
  password: Joi.string().required(),
  language: Joi.string().valid(...languageEnum),
  workspaceId: Joi.string().allow(null, ""),
});

export const updateUserSchema = Joi.object({
  userId: Joi.string().required(),
  name: Joi.string(),
  email: Joi.string().email(),
  role: Joi.string().valid(...roleEnum),
  image: Joi.string().allow(null, ""),
  password: Joi.string(),
  language: Joi.string().valid(...languageEnum),
  workspaceId: Joi.string().allow(null, ""),
});

export const deleteUserSchema = Joi.object({
  userId: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string(),
  language: Joi.string().valid(...languageEnum),
  currentPassword: Joi.string(),
  password: Joi.string().min(6),
})
  .with("password", "currentPassword")
  .or("name", "language", "password");

