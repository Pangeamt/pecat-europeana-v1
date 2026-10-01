-- Additive and backward-compatible with the running deployment: the type of each
-- inline tag of a segment (glossary, unit, &deg;...) for the editor chips.
-- Nullable: documents imported before this keep showing the bare placeholder.
ALTER TABLE `tus` ADD COLUMN `tagInfo` JSON NULL;
