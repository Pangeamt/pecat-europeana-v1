-- Additive, backward-compatible with the running deployment that still
-- reads only `client_projects.profileId`.
-- Apply manually with:
--   pnpm exec prisma db execute --file prisma/migrations/20260928140000_project_profiles/migration.sql --schema=./prisma/schema.prisma
-- The companion backfill.sql runs at deploy time (see that file).

-- 1. A project can now have several valid profiles; the row with
--    isDefault=true mirrors client_projects.profileId.
CREATE TABLE `client_project_profiles` (
    `projectId` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `client_project_profiles_profileId_fkey`(`profileId`),
    PRIMARY KEY (`projectId`, `profileId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `client_project_profiles`
    ADD CONSTRAINT `client_project_profiles_projectId_fkey`
    FOREIGN KEY (`projectId`) REFERENCES `client_projects`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `client_project_profiles`
    ADD CONSTRAINT `client_project_profiles_profileId_fkey`
    FOREIGN KEY (`profileId`) REFERENCES `profiles`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Documents record the profile they were actually translated with,
--    independent of client_projects.profileId (the project's default).
--    Nullable so existing inserts (old code) keep working untouched.
ALTER TABLE `projects` ADD COLUMN `profileId` VARCHAR(191) NULL;
ALTER TABLE `projects` ADD INDEX `projects_profileId_fkey`(`profileId`);

ALTER TABLE `projects`
    ADD CONSTRAINT `projects_profileId_fkey`
    FOREIGN KEY (`profileId`) REFERENCES `profiles`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
