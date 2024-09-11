import type Quill from "quill";
import { QuillLanguageTool } from ".";
/**
 * Clean all suggestion boxes from an HTML string
 *
 * @param html HTML to clean
 * @returns Cleaned text
 */
export declare function getCleanedHtml(html: string): string;
/**
 * Remove all suggestion boxes from the editor.
 */
export declare function removeSuggestionBoxes(quillEditor: Quill): void;
/**
 * Manager for the suggestion boxes.
 * This handles inserting and removing suggestion box elements from the editor.
 */
export declare class SuggestionBoxes {
    private readonly parent;
    constructor(parent: QuillLanguageTool);
    /**
     * Remove all suggestion boxes from the editor.
     */
    removeSuggestionBoxes(): void;
    /**
     * Insert a suggestion box into the editor.
     *
     * This uses the matches stored in the parent class
     */
    addSuggestionBoxes(): void;
}
