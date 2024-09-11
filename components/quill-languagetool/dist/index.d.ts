/// <reference types="node" />
import type Quill from "quill";
import { SuggestionBoxes } from "./SuggestionBoxes";
import "./QuillLanguageTool.css";
import PopupManager from "./PopupManager";
import { LanguageToolApiParams, MatchesEntity } from "./types";
import LoadingIndicator from "./LoadingIndicator";
export declare type QuillLanguageToolParams = {
  server: string;
  language: string;
  disableNativeSpellcheck: boolean;
  cooldownTime: number;
  showLoadingIndicator: boolean;
  apiOptions?: Partial<LanguageToolApiParams>;
};
/**
 * QuillLanguageTool is a Quill plugin that provides spellchecking and grammar checking
 * using the LanguageTool API.
 */
export declare class QuillLanguageTool {
  quill: Quill;
  params: QuillLanguageToolParams;
  static DEFAULTS: QuillLanguageToolParams;
  protected typingCooldown?: NodeJS.Timeout;
  protected loopPreventionCooldown?: NodeJS.Timeout;
  protected boxes: SuggestionBoxes;
  protected popups: PopupManager;
  protected loader: LoadingIndicator;
  matches: MatchesEntity[];
  /**
   * Create a new QuillLanguageTool instance.
   *
   * @param quill Instance of the Qill editor.
   * @param params Options for the QuillLanguageTool instance.
   */
  constructor(quill: Quill, params: QuillLanguageToolParams);
  private disableNativeSpellcheckIfSet;
  private onTextChange;
  public checkSpelling;
  private getLanguageToolResults;
  private getApiParams;
  preventLoop(): void;
}
/**
 * Register all QuillLanguageTool modules with Quill.
 *
 * This needs access to the exact Quill static instance
 * you will be using in your application.
 *
 * Example:
 * ```
 * import Quill from "quill";
 * import registerQuillLanguageTool from "quill-languagetool";
 * registerQuillLanguageTool(Quill);
 * ```
 *
 * @param Quill Quill static instance.
 */
export default function registerQuillLanguageTool(Quill: any): void;
export { getCleanedHtml, removeSuggestionBoxes } from "./SuggestionBoxes";
