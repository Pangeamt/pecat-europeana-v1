-- CreateTable: workspaces
CREATE TABLE `workspaces` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed: workspace por defecto para migrar datos existentes
INSERT INTO `workspaces` (`id`, `name`, `createdAt`, `updatedAt`)
VALUES ('default_workspace', 'Default Workspace', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- AlterTable: users (añade workspaceId nullable + actualiza enum Role)
ALTER TABLE `users` ADD COLUMN `workspaceId` VARCHAR(191) NULL,
    MODIFY `role` ENUM('SUPER', 'ADMIN', 'USER') NOT NULL DEFAULT 'USER';

-- Backfill: asigna todos los usuarios existentes al workspace por defecto
UPDATE `users` SET `workspaceId` = 'default_workspace' WHERE `workspaceId` IS NULL;

-- AlterTable: projects (añade workspaceId primero como nullable para poder rellenar)
ALTER TABLE `projects` ADD COLUMN `workspaceId` VARCHAR(191) NULL;

-- Backfill: asigna todos los proyectos existentes al workspace por defecto
UPDATE `projects` SET `workspaceId` = 'default_workspace' WHERE `workspaceId` IS NULL;

-- AlterTable: ahora que está poblada, hacemos la columna NOT NULL
ALTER TABLE `projects` MODIFY `workspaceId` VARCHAR(191) NOT NULL;

-- CreateTable: tms
CREATE TABLE `tms` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NULL,
    `sourceLanguage` VARCHAR(191) NOT NULL,
    `targetLanguage` VARCHAR(191) NOT NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tms_workspaceId_fkey`(`workspaceId`),
    INDEX `tms_createdByUserId_fkey`(`createdByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `projects_workspaceId_fkey` ON `projects`(`workspaceId`);

-- CreateIndex
CREATE INDEX `users_workspaceId_fkey` ON `users`(`workspaceId`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tms` ADD CONSTRAINT `tms_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tms` ADD CONSTRAINT `tms_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
