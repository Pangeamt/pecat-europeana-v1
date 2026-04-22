export type TmContext = {
  user: string;
  project?: string | null;
  domain?: string | null;
  source: string;
  target: string;
};

export type TranslationMemory = {
  id: string;
  name: string;
  context: TmContext;
};

export type TranslationUnitContext = {
  user?: string | null;
  project?: string | null;
  domain?: string | null;
};

export type TranslationUnit = {
  id: string;
  translation_memory_id: string;
  source_language: string;
  target_language: string;
  source_text: string;
  translated_text: string;
  context?: TranslationUnitContext;
  create_date?: string;
  update_date?: string;
  similarity?: {
    levenshtein: number;
    jaccard: number;
  };
};

export type CreateTmPayload = {
  name: string;
  user?: string | null;
  project?: string | null;
  domain?: string | null;
  source: string;
  target: string;
  workspaceId?: string | null;
};

export type UpdateTmPayload = {
  id: string;
  name?: string | null;
  project?: string | null;
  domain?: string | null;
};

export type ListTmQuery = {
  name?: string | null;
  user?: string | null;
  project?: string | null;
  domain?: string | null;
  source?: string | null;
  target?: string | null;
  workspaceId?: string | null;
  size?: number | string | null;
};

export type ListResult<T> = {
  total: number;
  docs: T[];
};

export type TmListResponse = ListResult<TranslationMemory>;
export type TuListResponse = ListResult<TranslationUnit>;

export type CreateTuPayload = {
  translation_memory_id: string;
  source_language: string;
  target_language: string;
  source_text: string;
  translated_text: string;
  user?: string | null;
  project?: string | null;
  domain?: string | null;
};

export type UpdateTuPayload = CreateTuPayload & {
  translation_unit_id: string;
};

export type SearchTuQuery = {
  translation_memory_id: string;
  source_language: string;
  target_language: string;
  source_text: string;
  user?: string | null;
  project?: string | null;
  domain?: string | null;
  perTerm?: boolean;
  minSimilarity?: number;
};

export type ProjectLogsStats = {
  projectId: string;
  tmId: string;
  stats: {
    noMatch: number;
    "50To74": number;
    "75To84": number;
    "85To94": number;
    "95To99": number;
    "100": number;
  };
};

export type ProjectTu = {
  id: string;
  projectId: string;
  srcLiteral: string;
  translatedLiteral: string | null;
  reviewLiteral?: string | null;
  Status: string;
  levenshteinDistance?: number | null;
};

export type UpdateProjectTuPayload = {
  tuId: string;
  reviewLiteral?: string | null;
  action: "approve" | "reject";
  levenshteinDistance?: number;
};
