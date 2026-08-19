-- Additive, backward-compatible with the production deployment that still
-- runs the pre-hierarchy code against this same database.
-- Apply manually with:
--   pnpm exec prisma db execute --file prisma/migrations/20260819100000_project_hierarchy/migration.sql --schema=./prisma/schema.prisma
-- The companion backfill.sql runs at deploy time (see that file).

-- 1. Document status becomes a plain string (same values; the old Prisma
--    client keeps reading/writing the identical strings).
ALTER TABLE `projects` MODIFY COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'UPLOADED';

-- 2. New grouping entity.
CREATE TABLE `client_projects` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `profileId` VARCHAR(191) NULL,
    `tmThreshold` DOUBLE NOT NULL DEFAULT 0.75,
    `settings` JSON NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `client_projects_workspaceId_fkey`(`workspaceId`),
    INDEX `client_projects_profileId_fkey`(`profileId`),
    INDEX `client_projects_createdByUserId_fkey`(`createdByUserId`),
    INDEX `client_projects_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `client_projects`
    ADD CONSTRAINT `client_projects_workspaceId_fkey`
    FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `client_projects`
    ADD CONSTRAINT `client_projects_profileId_fkey`
    FOREIGN KEY (`profileId`) REFERENCES `profiles`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `client_projects`
    ADD CONSTRAINT `client_projects_createdByUserId_fkey`
    FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. Documents point to their parent project. Nullable + defaulted so the old
--    code's inserts keep working untouched.
ALTER TABLE `projects`
    ADD COLUMN `clientProjectId` VARCHAR(191) NULL,
    ADD COLUMN `inheritProfile` BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE `projects` ADD INDEX `projects_clientProjectId_idx`(`clientProjectId`);

ALTER TABLE `projects`
    ADD CONSTRAINT `projects_clientProjectId_fkey`
    FOREIGN KEY (`clientProjectId`) REFERENCES `client_projects`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
