-- Add updateTm flag to project_tms to mark which TMs should be updated when reviewing a project
ALTER TABLE `project_tms` ADD COLUMN `updateTm` BOOLEAN NOT NULL DEFAULT false;
