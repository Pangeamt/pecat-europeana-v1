export interface LanguageToolApi {
    software: Software;
    warnings: Warnings;
    language: Language;
    matches?: MatchesEntity[] | null;
}
export interface Software {
    name: string;
    version: string;
    buildDate: string;
    apiVersion: number;
    premium: boolean;
    premiumHint: string;
    status: string;
}
export interface Warnings {
    incompleteResults: boolean;
}
export interface Language {
    name: string;
    code: string;
    detectedLanguage: DetectedLanguage;
}
export interface DetectedLanguage {
    name: string;
    code: string;
    confidence: number;
}
export interface MatchesEntity {
    message: string;
    shortMessage: string;
    replacements?: ReplacementsEntity[] | null;
    offset: number;
    length: number;
    context: Context;
    sentence: string;
    type: Type;
    rule: Rule;
    ignoreForIncompleteSentence: boolean;
    contextForSureMatch: number;
}
export interface ReplacementsEntity {
    value: string;
}
export interface Context {
    text: string;
    offset: number;
    length: number;
}
export interface Type {
    typeName: string;
}
export interface Rule {
    id: string;
    description: string;
    issueType: string;
    category: Category;
}
export interface Category {
    id: string;
    name: string;
}
export declare type LanguageToolApiParams = {
    text: string;
    data: string;
    language: string;
    username: string;
    apiKey: string;
    dicts: string;
    motherTongue: string;
    preferredVariants: string;
    enabledRules: string;
    disabledRules: string;
    enabledCategories: string;
    disabledCategories: string;
    enabledOnly: string;
    level: "picky" | "default";
    [key: string]: any;
};
