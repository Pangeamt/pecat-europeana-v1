-- Add preferred UI language to users (defaults to English)
ALTER TABLE `users` ADD COLUMN `language` VARCHAR(191) NOT NULL DEFAULT 'en';
