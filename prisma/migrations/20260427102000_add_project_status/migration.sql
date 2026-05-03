-- CreateEnum
ALTER TABLE `projects`
    ADD COLUMN `status` ENUM(
      'UPLOADED',
      'PROCESSING',
      'OXIGEN_PROCESSING',
      'MTQE_PROCESSING',
      'READY',
      'OXIGEN_ERROR',
      'MTQE_ERROR'
    ) NOT NULL DEFAULT 'UPLOADED';

-- Backfill existing rows so legacy projects remain accessible
UPDATE `projects` SET `status` = 'READY';
