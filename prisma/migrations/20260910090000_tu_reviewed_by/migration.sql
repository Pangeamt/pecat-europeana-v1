-- Additive: who last confirmed/edited/rejected each segment. Name is a
-- display snapshot (the anonymous share-link translator has no user id).
ALTER TABLE `tus`
    ADD COLUMN `reviewedById` VARCHAR(191) NULL,
    ADD COLUMN `reviewedByName` VARCHAR(191) NULL;
