-- Additive, backward-compatible with the running deployment: the name of the
-- DAAIT quality preset (llm_preset) the profile points to. DAAIT resolves the
-- preset itself (models and batching per request, level/volatile memory when
-- the profile is saved); PECAT-E only stores and sends the name.
ALTER TABLE `profiles` ADD COLUMN `llmPreset` VARCHAR(64) NULL;
