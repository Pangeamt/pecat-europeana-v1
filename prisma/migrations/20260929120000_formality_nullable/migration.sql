-- Formality stops being forced to FORMAL: a profile can now be created/edited
-- with no formality at all ("Sin formalidad"), which the DAAIT mirror then
-- omits instead of sending an empty string.
ALTER TABLE `profiles` MODIFY `formality` ENUM('FORMAL', 'NEUTRO', 'INFORMAL') NULL;
