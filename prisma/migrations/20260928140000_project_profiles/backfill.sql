-- Idempotent data backfill. Run at deploy time and AGAIN right after the new
-- code is live (it picks up documents/projects the old code touched in
-- between):
--   pnpm exec prisma db execute --file prisma/migrations/20260928140000_project_profiles/backfill.sql --schema=./prisma/schema.prisma

-- 1. Every project's existing single profile becomes its default entry in
--    the new N:N table.
INSERT INTO `client_project_profiles` (`projectId`, `profileId`, `isDefault`, `createdAt`)
SELECT cp.id, cp.profileId, true, NOW(3)
FROM `client_projects` cp
WHERE cp.profileId IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM `client_project_profiles` pp
      WHERE pp.projectId = cp.id AND pp.profileId = cp.profileId
  );

-- 2. Existing documents implicitly used their project's (single) profile —
--    make that explicit on the row itself.
UPDATE `projects` p
JOIN `client_projects` cp ON cp.id = p.clientProjectId
SET p.profileId = cp.profileId
WHERE p.profileId IS NULL
  AND cp.profileId IS NOT NULL;
