-- Additive and backward-compatible with the running deployment: the edit history of
-- a segment (one row per saved action, with text, status and MTQE before / after).
-- A new table only; nothing existing changes. No foreign key on purpose: the history
-- is written best-effort and must never block a re-import that rebuilds the segments.
CREATE TABLE `tu_revisions` (
    `id` VARCHAR(191) NOT NULL,
    `tuId` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `textBefore` TEXT NULL,
    `textAfter` TEXT NULL,
    `statusBefore` VARCHAR(191) NULL,
    `statusAfter` VARCHAR(191) NULL,
    `mtqeBefore` DOUBLE NULL,
    `mtqeAfter` DOUBLE NULL,
    `propagatedFromId` VARCHAR(191) NULL,
    `byUserId` VARCHAR(191) NULL,
    `byName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tu_revisions_tuId_createdAt_idx`(`tuId`, `createdAt`),
    INDEX `tu_revisions_documentId_idx`(`documentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
