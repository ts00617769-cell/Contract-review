import OpenAI from "openai";
import { DISCLAIMER_SHORT } from "./disclaimer";
import { ruleLibraryBrief } from "./rules";
import type { Finding, FindingCategory, ReviewEngine, Severity } from "./types";

type AiFinding = {
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  category: FindingCategory;
  clauseTitle: string;
  originalText: string;
  issueExplanation: string;
  suggestedFix: string;
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: {
            type: "string",
            enum: ["unfair", "payment", "ip"],
          },
          riskLevel: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
          clauseTitle: { type: "string" },
          originalText: { type: "string" },
          issueExplanation: { type: "string" },
          suggestedFix: { type: "string" },
        },
        required: [
          "category",
          "riskLevel",
          "clauseTitle",
          "originalText",
          "issueExplanation",
          "suggestedFix",
        ],
      },
    },
  },
  required: ["summary", "findings"],
} as const;

export function hasOpenAiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function parseAiResponse(raw: string): { summary: string; findings: AiFinding[] } {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object") throw new Error("Invalid review response");

  const candidate = value as { summary?: unknown; findings?: unknown };
  if (typeof candidate.summary !== "string" || !Array.isArray(candidate.findings)) {
    throw new Error("Invalid review response shape");
  }

  const findings = candidate.findings.map((item): AiFinding => {
    if (!item || typeof item !== "object") throw new Error("Invalid finding");
    const finding = item as Record<string, unknown>;
    const validRisk = ["HIGH", "MEDIUM", "LOW"].includes(String(finding.riskLevel));
    const validCategory = ["unfair", "payment", "ip"].includes(String(finding.category));
    const stringFields = [
      "clauseTitle",
      "originalText",
      "issueExplanation",
      "suggestedFix",
    ] as const;
    if (
      !validRisk ||
      !validCategory ||
      stringFields.some((field) => typeof finding[field] !== "string")
    ) {
      throw new Error("Invalid finding shape");
    }
    return {
      riskLevel: finding.riskLevel as AiFinding["riskLevel"],
      category: finding.category as FindingCategory,
      clauseTitle: finding.clauseTitle as string,
      originalText: finding.originalText as string,
      issueExplanation: finding.issueExplanation as string,
      suggestedFix: finding.suggestedFix as string,
    };
  });

  return { summary: candidate.summary, findings };
}

export async function reviewWithOpenAi(contractText: string): Promise<{
  engine: ReviewEngine;
  summary: string;
  findings: Finding[];
}> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "contract_review",
        strict: true,
        schema: SCHEMA,
      },
    },
    messages: [
      {
        role: "system",
        content: `你是「契約哨兵」的合約初審助手，專門幫台灣接案設計師與行銷顧問標出高風險條款。
只做風險提示與修改建議，不是律師，也不是正式法律意見。
重點三類：1) 不對等條款 2) 模糊付款 3) 智財轉讓陷阱。
使用台灣接案實務用語（訂金／尾款、驗收期限、著作財產權、原始檔、作品集、發票先後、墊付媒體費、KPI 保證）。
逐一檢查以下五大陷阱，不得遺漏：
1) 強迫拋棄著作人格權，或要求永久／全面不行使著作人格權。
2) 驗收期間、驗收標準不明，逾期不視為通過，或無限次免費修改。
3) 結算、對帳或發票後 60–90 天以上才付款，或未約定合理訂金與分期。
4) 無合理期間、範圍、地域或補償的競業禁止，以及過高違約金、違約定金或懲罰性賠償。
5) 智財權在尾款付清前即移轉，或未明定「全部款項付清後才移轉」。
riskLevel 僅能是 HIGH、MEDIUM、LOW。originalText 必須逐字引用合約原文；屬條款缺漏時寫「（全文未見相關約定）」。
issueExplanation 應清楚說明對接案者的實際風險；suggestedFix 必須是完整、可直接貼入合約的替代條文，不要只寫抽象建議。
回傳內容只能符合指定 JSON Schema，不得加入 Markdown、前後說明或 Schema 外欄位。
每份合約找出最重要的 5–14 個發現，不要灌水。
${DISCLAIMER_SHORT}

規則庫摘要（請對照，但以合約本文為準）：
${ruleLibraryBrief()}`,
      },
      {
        role: "user",
        content: `請初審以下合約全文：\n\n${contractText}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI returned empty content");
  }

  const parsed = parseAiResponse(raw);
  const severityMap: Record<AiFinding["riskLevel"], Severity> = {
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
  };

  return {
    engine: "openai",
    summary: parsed.summary,
    findings: parsed.findings.map((finding, index) => ({
      id: `ai-${index + 1}`,
      category: finding.category,
      severity: severityMap[finding.riskLevel],
      title: finding.clauseTitle,
      quote: finding.originalText,
      why: finding.issueExplanation,
      suggestion: finding.suggestedFix,
    })),
  };
}
