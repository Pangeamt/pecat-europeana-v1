-- DAAIT post-translation pipeline: MTQE re-scoring, LLM review verdicts and
-- applicable post-edit suggestions per TU; per-document pipeline telemetry;
-- profile alignment with the DAAIT mirror. All additive.
ALTER TABLE `tus` ADD COLUMN `blockReason` VARCHAR(191) NULL;
ALTER TABLE `tus` ADD COLUMN `mtqeOriginal` DOUBLE NULL;
ALTER TABLE `tus` ADD COLUMN `llmVerdict` VARCHAR(191) NULL;
ALTER TABLE `tus` ADD COLUMN `llmComment` VARCHAR(400) NULL;
ALTER TABLE `tus` ADD COLUMN `suggestionLiteral` TEXT NULL;
ALTER TABLE `tus` ADD COLUMN `suggestionStatus` VARCHAR(191) NULL;
ALTER TABLE `tus` ADD COLUMN `suggestionMeta` JSON NULL;
ALTER TABLE `tus` ADD COLUMN `daaitStatus` VARCHAR(191) NULL;

ALTER TABLE `projects` ADD COLUMN `pipelineStats` JSON NULL;

ALTER TABLE `profiles` ADD COLUMN `sourceLanguage` VARCHAR(191) NULL;
ALTER TABLE `profiles` ADD COLUMN `targetLanguage` VARCHAR(191) NULL;
ALTER TABLE `profiles` ADD COLUMN `taskLevel` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE `profiles` ADD COLUMN `llmModels` JSON NULL;
