export type SourceType = "pdf" | "email" | "csv" | "text";

export type SourceItem = {
  id: string;
  title: string;
  type: SourceType;
  snippet: string;
  meta?: string;
};

export type StructuredTruth = {
  decision: string;
  budget: string;
  approvedBy: string;
  evidence: string[];
  status: string;
  conflicts: string;
};

export type ConflictComparisonItem = {
  source: string;
  value: string;
};

export type ConflictItem = {
  title: string;
  severity: "none" | "low" | "medium" | "high";
  type: string;
  note: string;
  comparison: ConflictComparisonItem[];
  likelyLatestTruth: string;
  recommendedAction: string;
};

export type QueryResponse = {
  answer: string;
  sources: SourceItem[];
  toolUsed?: string[];
  status?: "success" | "empty";
  elapsedSeconds?: number;
  structuredTruth?: StructuredTruth;
  conflictsPanel?: ConflictItem[];

  queryType?: string;
  routerDecision?: string[];
  routerReason?: string;
  followUpSuggestions?: string[];
};