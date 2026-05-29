CREATE TABLE `glossaries` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NULL,
    `sourceLanguage` VARCHAR(191) NOT NULL,
    `targetLanguage` VARCHAR(191) NOT NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `glossaries_workspaceId_fkey`(`workspaceId`),
    INDEX `glossaries_createdByUserId_fkey`(`createdByUserId`),
    INDEX `glossaries_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `project_glossaries` (
    `projectId` VARCHAR(191) NOT NULL,
    `glossaryId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`projectId`, `glossaryId`),
    INDEX `project_glossaries_glossaryId_idx`(`glossaryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `glossaries`
    ADD CONSTRAINT `glossaries_createdByUserId_fkey`
    FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `glossaries`
    ADD CONSTRAINT `glossaries_workspaceId_fkey`
    FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `project_glossaries`
    ADD CONSTRAINT `project_glossaries_projectId_fkey`
    FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `project_glossaries`
    ADD CONSTRAINT `project_glossaries_glossaryId_fkey`
    FOREIGN KEY (`glossaryId`) REFERENCES `glossaries`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
