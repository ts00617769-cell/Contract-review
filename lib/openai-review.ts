import OpenAI from "openai";
import { DISCLAIMER_SHORT } from "./disclaimer";
import { ruleLibraryBrief } from "./rules";
import type { Finding, ReviewEngine } from "./types";

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
          severity: { type: "string", enum: ["high", "medium", "low"] },
          title: { type: "string" },
          quote: { type: "string" },
          why: { type: "string" },
          suggestion: { type: "string" },
        },
        required: [
          "category",
          "severity",
          "title",
          "quote",
          "why",
          "suggestion",
        ],
      },
    },
  },
  required: ["summary", "findings"],
} as const;

export function hasOpenAiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
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
quote 必須盡量引用合約原文片段；找不到原文就寫「（未見相關約定）」。
suggestion 要寫出可直接貼上談判的條文草案。
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

  const parsed = JSON.parse(raw) as {
    summary: string;
    findings: Array<Omit<Finding, "id">>;
  };

  return {
    engine: "openai",
    summary: parsed.summary,
    findings: parsed.findings.map((finding, index) => ({
      ...finding,
      id: `ai-${index + 1}`,
    })),
  };
}
