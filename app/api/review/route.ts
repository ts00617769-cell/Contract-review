import { NextResponse } from "next/server";
import { extractPdfText } from "@/lib/extract-pdf";
import { hasOpenAiKey, reviewWithOpenAi } from "@/lib/openai-review";
import { freeReviewCookieHeader, hasUsedFreeReview } from "@/lib/quota";
import { scanWithRuleLibrary } from "@/lib/scan-rules";
import type { Finding, ReviewResult } from "@/lib/types";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

function mergeFindings(ai: Finding[], rules: Finding[]): Finding[] {
  const seen = new Set(
    ai.map((item) => `${item.category}:${item.title}`.replace(/\s+/g, "")),
  );
  const extra = rules.filter((item) => {
    const key = `${item.category}:${item.title}`.replace(/\s+/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...ai, ...extra].slice(0, 16);
}

export async function POST(request: Request) {
  if (await hasUsedFreeReview()) {
    return NextResponse.json(
      {
        code: "quota_exceeded",
        message: "免費審閱額度已用完",
      },
      { status: 402 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "請上傳 PDF 檔案。" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "檔案請小於 10MB。" }, { status: 400 });
  }

  const typeOk =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!typeOk) {
    return NextResponse.json({ error: "僅支援 PDF。" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let pageCount = 0;
  let text = "";

  try {
    const extracted = await extractPdfText(bytes);
    pageCount = extracted.pageCount;
    text = extracted.text;
  } catch {
    return NextResponse.json(
      { error: "無法讀取這份 PDF，請改用可選取文字的檔案。" },
      { status: 400 },
    );
  }

  if (text.replace(/\s/g, "").length < 80) {
    return NextResponse.json(
      {
        error:
          "抽到的文字過少（可能是掃描件或圖片 PDF）。請提供可複製文字的合約檔。",
      },
      { status: 400 },
    );
  }

  const ruleFindings = scanWithRuleLibrary(text);
  let result: ReviewResult = {
    engine: "rules",
    usedFallback: true,
    summary:
      ruleFindings.length > 0
        ? `規則庫標出 ${ruleFindings.length} 處需注意條款，請逐條對照原文與修改建議。`
        : "規則庫未命中常見陷阱，仍建議人工閱讀付款、驗收、智財與終止條款。",
    findings: ruleFindings,
    pageCount,
    fileName: file.name,
  };

  if (hasOpenAiKey()) {
    try {
      const ai = await reviewWithOpenAi(text);
      result = {
        engine: "openai",
        usedFallback: false,
        summary: ai.summary,
        findings: mergeFindings(ai.findings, ruleFindings),
        pageCount,
        fileName: file.name,
      };
    } catch {
      result = {
        ...result,
        summary: `AI 初審暫時無法使用，已改以台灣接案規則庫標註。${result.summary}`,
      };
    }
  }

  const response = NextResponse.json(result);
  response.headers.append("Set-Cookie", freeReviewCookieHeader());
  return response;
}
