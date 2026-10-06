import Joi from "joi";

export const evaluateTuSchema = Joi.object({
  tuId: Joi.string().required(),
  target: Joi.string().allow("", null).required(),
});

export const updateTuSchema = Joi.object({
  tuId: Joi.string().required(),
  reviewLiteral: Joi.string().allow(null, "").optional(),
  action: Joi.string()
    .valid(
      "approve",
      "save_draft",
      "reject",
      "apply_suggestion",
      "discard_suggestion",
      "lock",
      "unlock",
      "restore",
    )
    .required(),
  // "restore" (undo / redo of a saved action): the state to put the segment
  // back to. `reviewed` = a reviewer had saved it (false clears the trace).
  snapshot: Joi.when("action", {
    is: "restore",
    then: Joi.object({
      reviewLiteral: Joi.string().allow(null, "").required(),
      Status: Joi.string()
        .valid("EDITED", "ACCEPTED", "TRANSLATED_MT", "NOT_REVIEWED", "REJECTED")
        .required(),
      block: Joi.boolean().required(),
      blockReason: Joi.string()
        .valid("TM_MATCH", "LLM_JUDGE", "INTERNAL", "MANUAL")
        .allow(null)
        .optional(),
      mtqeV2Score: Joi.number().min(0).max(1).allow(null).optional(),
      reviewed: Joi.boolean().required(),
    }).required(),
    otherwise: Joi.forbidden(),
  }),
  block: Joi.boolean().optional(),
  levenshteinDistance: Joi.number().optional(),
});
