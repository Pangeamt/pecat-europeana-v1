-- Additive, backward-compatible with the production deployment that still
-- runs older code against this same database.
-- Apply manually with:
--   pnpm exec prisma db execute --file prisma/migrations/20260820102443_document_assignments/migration.sql --schema=./prisma/schema.prisma

ALTER TABLE `projects`
    ADD COLUMN `translatorId` VARCHAR(191) NULL,
    ADD COLUMN `reviewerId` VARCHAR(191) NULL;

ALTER TABLE `projects` ADD INDEX `projects_translatorId_fkey`(`translatorId`);
ALTER TABLE `projects` ADD INDEX `projects_reviewerId_fkey`(`reviewerId`);

ALTER TABLE `projects`
    ADD CONSTRAINT `projects_translatorId_fkey`
    FOREIGN KEY (`translatorId`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `projects`
    ADD CONSTRAINT `projects_reviewerId_fkey`
    FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
