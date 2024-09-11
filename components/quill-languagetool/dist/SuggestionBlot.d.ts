import { MatchesEntity } from "./types";
/**
 * Quill editor blot that represents a suggestion.
 *
 * This is added to the text to enable the suggestion to be selected and inserted.
 *
 * @param Quill Quill static instance
 * @returns Blot class that can be registered on the Quill instance
 */
export default function createSuggestionBlotForQuillInstance(Quill: any): {
    new (): {
        [x: string]: any;
        optimize(): void;
    };
    [x: string]: any;
    blotName: string;
    tagName: string;
    create(match?: MatchesEntity | undefined): HTMLElement;
};
