import { QuillLanguageTool } from ".";
/**
 * Manager for the loading indicator.
 *
 * This handles showing and hiding the loading indicator in the editor.
 */
export default class LoadingIndicator {
    private readonly parent;
    private currentLoader?;
    constructor(parent: QuillLanguageTool);
    startLoading(): void;
    stopLoading(): void;
}
