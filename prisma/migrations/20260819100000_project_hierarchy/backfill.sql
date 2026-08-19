-- Idempotent data backfill. Run at deploy time and AGAIN right after the new
-- code is live (it picks up documents the old code created in between):
--   pnpm exec prisma db execute --file prisma/migrations/20260819100000_project_hierarchy/backfill.sql --schema=./prisma/schema.prisma
-- Statement order matters: inheritProfile must be flagged before the FK
-- backfill because `clientProjectId IS NULL` is the idempotency guard.

-- 1. One "General" project per workspace that owns documents and lacks one.
--    Creator = owner of the workspace's oldest document.
INSERT INTO `client_projects` (`id`, `name`, `tmThreshold`, `createdByUserId`, `workspaceId`, `createdAt`, `updatedAt`)
SELECT UUID(), 'General', 0.75, sub.userId, sub.workspaceId, NOW(3), NOW(3)
FROM (
    SELECT p.workspaceId,
           SUBSTRING_INDEX(GROUP_CONCAT(p.userId ORDER BY p.createdAt), ',', 1) AS userId
    FROM `projects` p
    GROUP BY p.workspaceId
) sub
WHERE NOT EXISTS (
    SELECT 1 FROM `client_projects` cp
    WHERE cp.workspaceId = sub.workspaceId AND cp.name = 'General'
);

-- 2. Legacy documents carry their own project_tms/project_glossaries links,
--    so they never inherited a profile.
UPDATE `projects` SET `inheritProfile` = false WHERE `clientProjectId` IS NULL;

-- 3. Attach orphan documents to their workspace's "General" project.
UPDATE `projects` p
JOIN `client_projects` cp
    ON cp.workspaceId = p.workspaceId AND cp.name = 'General'
SET p.clientProjectId = cp.id
WHERE p.clientProjectId IS NULL;
