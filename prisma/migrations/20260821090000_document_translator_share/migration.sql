-- Additive only: two nullable columns on `projects` (Document model) for the
-- anonymous "share as translator" link. No existing column/table is touched.
ALTER TABLE `projects`
  ADD COLUMN `translatorShareToken` VARCHAR(191) NULL,
  ADD COLUMN `translatorShareCreatedAt` DATETIME(3) NULL;

CREATE UNIQUE INDEX `projects_translatorShareToken_key` ON `projects`(`translatorShareToken`);
