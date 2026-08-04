import Joi from "joi";

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  DATABASE_URL: Joi.string().uri({ scheme: ["mysql"] }).required(),
  NEXTAUTH_SECRET: Joi.string().required(),
  NEXTAUTH_URL: Joi.string().uri().required(),
  NEXT_PUBLIC_API_BASE_URL: Joi.string().uri().required(),
  TIKAL_BIN: Joi.string().optional().allow(""),
  SOFFICE_BIN: Joi.string().optional().allow(""),
  STORAGE_DIR: Joi.string().optional().allow(""),
  REDIS_URL: Joi.string()
    .uri({ scheme: ["redis", "rediss"] })
    .optional()
    .allow(""),
  DAAIT_API_HOST: Joi.string().uri().optional().allow(""),
  MTQE: Joi.string().uri().optional().allow(""),
  MTQE_API_KEY: Joi.string().optional().allow(""),
}).unknown(true);

const { error, value } = schema.validate(process.env, {
  abortEarly: false,
  stripUnknown: false,
});

if (error) {
  const details = error.details.map((d) => `- ${d.message}`).join("\n");
  throw new Error(`Invalid environment variables:\n${details}`);
}

export const env = {
  NODE_ENV: value.NODE_ENV,
  DATABASE_URL: value.DATABASE_URL,
  NEXTAUTH_SECRET: value.NEXTAUTH_SECRET,
  NEXTAUTH_URL: value.NEXTAUTH_URL,
  NEXT_PUBLIC_API_BASE_URL: value.NEXT_PUBLIC_API_BASE_URL,
  TIKAL_BIN: value.TIKAL_BIN,
  SOFFICE_BIN: value.SOFFICE_BIN,
  STORAGE_DIR: value.STORAGE_DIR,
  REDIS_URL: value.REDIS_URL,
  DAAIT_API_HOST: value.DAAIT_API_HOST,
  MTQE: value.MTQE,
  MTQE_API_KEY: value.MTQE_API_KEY,
};
