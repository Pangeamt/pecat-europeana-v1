-- AlterTable
ALTER TABLE `tms` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `tms_deletedAt_idx` ON `tms`(`deletedAt`);

-- CreateIndex
CREATE INDEX `users_deletedAt_idx` ON `users`(`deletedAt`);
