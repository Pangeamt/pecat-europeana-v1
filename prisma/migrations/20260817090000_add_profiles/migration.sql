CREATE TABLE `profiles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `formality` ENUM('FORMAL', 'NEUTRO', 'INFORMAL') NOT NULL DEFAULT 'FORMAL',
    `instructions` TEXT NULL,
    `domain` VARCHAR(191) NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `profiles_workspaceId_fkey`(`workspaceId`),
    INDEX `profiles_createdByUserId_fkey`(`createdByUserId`),
    INDEX `profiles_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `profile_tms` (
    `profileId` VARCHAR(191) NOT NULL,
    `tmId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`profileId`, `tmId`),
    INDEX `profile_tms_tmId_idx`(`tmId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `profile_glossaries` (
    `profileId` VARCHAR(191) NOT NULL,
    `glossaryId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`profileId`, `glossaryId`),
    INDEX `profile_glossaries_glossaryId_idx`(`glossaryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `profiles`
    ADD CONSTRAINT `profiles_createdByUserId_fkey`
    FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `profiles`
    ADD CONSTRAINT `profiles_workspaceId_fkey`
    FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `profile_tms`
    ADD CONSTRAINT `profile_tms_profileId_fkey`
    FOREIGN KEY (`profileId`) REFERENCES `profiles`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `profile_tms`
    ADD CONSTRAINT `profile_tms_tmId_fkey`
    FOREIGN KEY (`tmId`) REFERENCES `tms`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `profile_glossaries`
    ADD CONSTRAINT `profile_glossaries_profileId_fkey`
    FOREIGN KEY (`profileId`) REFERENCES `profiles`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `profile_glossaries`
    ADD CONSTRAINT `profile_glossaries_glossaryId_fkey`
    FOREIGN KEY (`glossaryId`) REFERENCES `glossaries`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
