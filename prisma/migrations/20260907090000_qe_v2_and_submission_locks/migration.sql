-- Additive, backward-compatible with the running deployment.
--
-- 1. Second MTQE score (QE v2) per translation unit: set once by the
--    pipeline, displayed next to the v1 score for comparison.
ALTER TABLE `tus` ADD COLUMN `mtqeV2Score` DOUBLE NULL;

-- 2. Submission locks per document: once the translator/reviewer submits,
--    that role can no longer edit segments until a PM reopens.
--    editLog keeps an append-only trace of submit/reopen actions.
ALTER TABLE `projects`
    ADD COLUMN `translatorSubmittedAt` DATETIME(3) NULL,
    ADD COLUMN `reviewerSubmittedAt` DATETIME(3) NULL,
    ADD COLUMN `editLog` JSON NULL;
