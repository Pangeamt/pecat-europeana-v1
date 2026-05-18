UPDATE `projects`
SET `tmThreshold` = `tmThreshold` / 100
WHERE `tmThreshold` > 1;

ALTER TABLE `projects`
    MODIFY `tmThreshold` DOUBLE NOT NULL DEFAULT 0;
