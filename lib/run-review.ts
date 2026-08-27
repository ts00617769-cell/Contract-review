import { hasOpenAiKey, reviewWithOpenAi } from "@/lib/openai-review";
import { scanWithRuleLibrary } from "@/lib/scan-rules";
import type { Finding, ReviewResult } from "@/lib/types";

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

export async function runContractReview(options: {
  text: string;
  pageCount: number;
  fileName: string;
  preferRulesOnly?: boolean;
}): Promise<ReviewResult> {
  const result: ReviewResult = {
    engine: "rules",
    usedFallback: true,
    summary: "",
    findings: scanWithRuleLibrary(options.text),
    pageCount: options.pageCount,
    fileName: options.fileName,
  };
  result.summary =
    result.findings.length > 0
      ? `規則庫標出 ${result.findings.length} 處需注意條款，請逐條對照原文與修改建議。`
      : "規則庫未命中常見陷阱，仍建議人工閱讀付款、驗收、智財與終止條款。";

  if (options.preferRulesOnly || !hasOpenAiKey()) {
    return result;
  }

  try {
    const ai = await reviewWithOpenAi(options.text);
    return {
      engine: "openai",
      usedFallback: false,
      summary: ai.summary,
      findings: mergeFindings(ai.findings, result.findings),
      pageCount: options.pageCount,
      fileName: options.fileName,
    };
  } catch {
    return {
      ...result,
      summary: `AI 初審暫時無法使用，已改以台灣接案規則庫標註。${result.summary}`,
    };
  }
}
