import { QuillLanguageTool } from ".";
/**
 * Manager for popups.
 *
 * This handles opening and closing suggestion popups in the editor
 * when a suggestion is selected.
 */
export default class PopupManager {
    private readonly parent;
    private openPopup?;
    private currentSuggestionElement?;
    constructor(parent: QuillLanguageTool);
    private addEventHandler;
    private closePopup;
    private handleSuggestionClick;
    private createSuggestionPopup;
}
