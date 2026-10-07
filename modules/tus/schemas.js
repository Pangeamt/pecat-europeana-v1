import Joi from "joi";
import { BULK_CONFIRM_MAX } from "../../lib/bulk-confirm";

export const evaluateTuSchema = Joi.object({
  tuId: Joi.string().required(),
  target: Joi.string().allow("", null).required(),
});

// "Confirm all": a list of segments of ONE document, confirmed in a single
// request. `documentId` names the document for a logged-in user; the share
// link's token names it instead.
export const bulkConfirmTusSchema = Joi.object({
  documentId: Joi.string().optional(),
  items: Joi.array()
    .items(
      Joi.object({
        tuId: Joi.string().required(),
        reviewLiteral: Joi.string().allow(null, "").optional(),
      }),
    )
    .min(1)
    .max(BULK_CONFIRM_MAX)
    .required(),
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
  // With "restore": whether the reviewer was undoing or redoing. It is what
  // the segment's history records ("Undone" / "Redone").
  direction: Joi.when("action", {
    is: "restore",
    then: Joi.string().valid("undo", "redo").default("undo"),
    otherwise: Joi.forbidden(),
  }),
  block: Joi.boolean().optional(),
  levenshteinDistance: Joi.number().optional(),
});
