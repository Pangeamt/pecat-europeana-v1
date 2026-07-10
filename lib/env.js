import Joi from "joi";

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  DATABASE_URL: Joi.string().uri({ scheme: ["mysql"] }).required(),
  NEXTAUTH_SECRET: Joi.string().required(),
  NEXTAUTH_URL: Joi.string().uri().required(),
  NEXT_PUBLIC_API_BASE_URL: Joi.string().uri().required(),
  SEGMENTED_TEXTS_HOST: Joi.string().uri().optional().allow(""),
  MT_TEXTS_HOST: Joi.string().uri().optional().allow(""),
  OXIGEN_API_HOST: Joi.string().uri().optional().allow(""),
  DAAIT_API_HOST: Joi.string().uri().optional().allow(""),
  MINT_CLIENT_ID: Joi.string().optional().allow(""),
  MINT_CLIENT_SECRET: Joi.string().optional().allow(""),
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
  SEGMENTED_TEXTS_HOST: value.SEGMENTED_TEXTS_HOST,
  MT_TEXTS_HOST: value.MT_TEXTS_HOST,
  OXIGEN_API_HOST: value.OXIGEN_API_HOST,
  DAAIT_API_HOST: value.DAAIT_API_HOST,
  MINT_CLIENT_ID: value.MINT_CLIENT_ID,
  MINT_CLIENT_SECRET: value.MINT_CLIENT_SECRET,
  MTQE: value.MTQE,
  MTQE_API_KEY: value.MTQE_API_KEY,
};
