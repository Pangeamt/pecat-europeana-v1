export type GlossaryContext = {
  user: string;
  project?: string | null;
  domain?: string | null;
  source: string;
  target: string;
};

// DAAIT build status (see modules/memory/status.js).
export type MemoryAssetStatus =
  | "NOT_STARTED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "REBUILDING"
  | "SUCCESS"
  | "FAILED";

export type Glossary = {
  id: string;
  name: string;
  context: GlossaryContext;
  status?: MemoryAssetStatus | null;
  total_entries?: number | null;
};

export type GlossaryEntry = {
  id: string;
  glossary_id: string;
  source_language: string;
  target_language: string;
  source_text: string;
  translated_text: string;
};

export type CreateGlossaryPayload = {
  name: string;
  user?: string | null;
  project?: string | null;
  domain?: string | null;
  source: string;
  target: string;
  workspaceId?: string | null;
};

export type UpdateGlossaryPayload = {
  id: string;
  name?: string | null;
  project?: string | null;
  domain?: string | null;
};

export type ListGlossaryQuery = {
  name?: string | null;
  user?: string | null;
  project?: string | null;
  domain?: string | null;
  source?: string | null;
  target?: string | null;
  workspaceId?: string | null;
  status?: MemoryAssetStatus | null;
  size?: number | string | null;
};

export type ListResult<T> = {
  total: number;
  docs: T[];
  page?: number;
  size?: number;
};

export type GlossaryListResponse = ListResult<Glossary>;
export type GlossaryEntryListResponse = ListResult<GlossaryEntry>;
