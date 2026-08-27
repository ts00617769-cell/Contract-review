export type FindingCategory = "unfair" | "payment" | "ip";
export type Severity = "high" | "medium" | "low";
export type ReviewEngine = "openai" | "rules";

export type Finding = {
  id: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  quote: string;
  why: string;
  suggestion: string;
  ruleId?: string;
};

export type ReviewResult = {
  engine: ReviewEngine;
  summary: string;
  findings: Finding[];
  pageCount: number;
  fileName: string;
  usedFallback: boolean;
};

export type QuotaState = {
  used: boolean;
};
