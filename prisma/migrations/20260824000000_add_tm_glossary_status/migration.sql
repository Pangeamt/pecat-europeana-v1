-- Add the DAAIT build status to TMs and glossaries. Existing rows start as
-- IN_PROGRESS on purpose: the memory-status worker reconciles them against
-- DAAIT (SUCCESS/FAILED) within seconds of the first sweep.
ALTER TABLE `tms` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'IN_PROGRESS';
ALTER TABLE `glossaries` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'IN_PROGRESS';
