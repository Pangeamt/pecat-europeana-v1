import Joi from "joi";

export const listQueueJobsQuerySchema = Joi.object({
  state: Joi.string()
    .valid("waiting", "active", "completed", "failed", "delayed", "paused")
    .default("failed"),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
});

export const queueJobActionSchema = Joi.object({
  jobId: Joi.string().required(),
  action: Joi.string().valid("retry", "remove").required(),
});
