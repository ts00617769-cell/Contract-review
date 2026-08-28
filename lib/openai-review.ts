import OpenAI from "openai";
import { ruleLibraryBrief } from "./rules";
import type { Finding, FindingCategory, ReviewEngine, Severity } from "./types";

type AiFinding = {
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  category: FindingCategory;
  clauseTitle: string;
  originalText: string;
  verdict: string;
  riskDetail: string;
  counterMeasure: string;
  suggestedClause: string;
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
          verdict: { type: "string" },
          riskDetail: { type: "string" },
          counterMeasure: { type: "string" },
          suggestedClause: { type: "string" },
        },
        required: [
          "category",
          "riskLevel",
          "clauseTitle",
          "originalText",
          "verdict",
          "riskDetail",
          "counterMeasure",
          "suggestedClause",
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
      "verdict",
      "riskDetail",
      "counterMeasure",
      "suggestedClause",
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
      verdict: finding.verdict as string,
      riskDetail: finding.riskDetail as string,
      counterMeasure: finding.counterMeasure as string,
      suggestedClause: finding.suggestedClause as string,
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
        content: `你是一位在台灣接案圈打滾十年以上、看過大量爛合約的法務前輩。你站在設計師、工程師與自由工作者這邊，任務是把客戶藏在合約裡的成本轉嫁直接抓出來。

語氣規則：
- 直白、犀利、講人話，像資深前輩在提醒後輩；不要像客服、律師函或 AI 機器人。
- 禁用「本條款可能存在潛在風險」、「建議諮詢律師」、「宜審慎評估」、「綜上所述」等公版官腔。
- 不恐嚇、不亂斷言條款必然無效，也不虛構法條。重點是講清楚簽下去後，錢、工時與權利會怎麼被拿走。
- verdict 只寫一句有力的大白話，直接點破陷阱，例如「這條是典型的不付尾款陷阱」。
- riskDetail 用 2–3 句拆解實際損失，不要重複 verdict。
- counterMeasure 寫成接案者能直接對客戶說出口的談判話術，態度穩、理由清楚，不卑不亢。
- suggestedClause 是可直接貼回合約的完整條文，不加「建議改為」等前綴。

分類只有：1) 不對等條款 2) 付款 3) 智財。使用台灣接案實務用語（訂金／尾款、驗收期限、著作財產權、原始檔、作品集、發票先後、墊付媒體費、KPI 保證）。
逐一檢查以下五大陷阱，不得遺漏：
1) 強迫拋棄著作人格權，或要求永久／全面不行使著作人格權。
2) 驗收期間、驗收標準不明，逾期不視為通過，或無限次免費修改。
3) 結算、對帳或發票後 60–90 天以上才付款，或未約定合理訂金與分期。
4) 無合理期間、範圍、地域或補償的競業禁止，以及過高違約金、違約定金或懲罰性賠償。
5) 智財權在尾款付清前即移轉，或未明定「全部款項付清後才移轉」。
riskLevel 僅能是 HIGH、MEDIUM、LOW。originalText 必須逐字引用合約原文；屬條款缺漏時寫「（全文未見相關約定）」。
verdict、riskDetail、counterMeasure、suggestedClause 四欄都必須有具體內容，不得互相複製。
回傳內容只能符合指定 JSON Schema，不得加入 Markdown、前後說明或 Schema 外欄位。
每份合約找出最重要的 5–14 個發現，不要灌水。

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
      verdict: finding.verdict,
      riskDetail: finding.riskDetail,
      counterMeasure: finding.counterMeasure,
      suggestedClause: finding.suggestedClause,
    })),
  };
}
