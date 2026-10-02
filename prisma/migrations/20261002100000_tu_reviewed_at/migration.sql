-- Additive and backward-compatible with the running deployment: when a reviewer
-- last saved a segment (the editor's "Last saved"). Nullable: segments nobody
-- has saved yet stay NULL.
ALTER TABLE `tus` ADD COLUMN `reviewedAt` DATETIME(3) NULL;
