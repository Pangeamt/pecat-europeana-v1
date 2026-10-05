-- Additive and backward-compatible with the running deployment: the segment as the
-- client's file had it at import (number in the CAT tool, confirmation level, origin of
-- its target, lock). All nullable: segments imported before this, and formats other
-- than SDLXLIFF / XLIFF, stay NULL and the editor falls back to what it showed before.
ALTER TABLE `tus`
  ADD COLUMN `segmentNumber` INTEGER NULL,
  ADD COLUMN `fileConf` VARCHAR(191) NULL,
  ADD COLUMN `fileOrigin` VARCHAR(191) NULL,
  ADD COLUMN `filePercent` INTEGER NULL,
  ADD COLUMN `fileTextMatch` VARCHAR(191) NULL,
  ADD COLUMN `fileLocked` BOOLEAN NULL,
  ADD COLUMN `fileTarget` BOOLEAN NULL;
