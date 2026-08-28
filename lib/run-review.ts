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
    usedFallback: false,
    summary: "",
    findings: scanWithRuleLibrary(options.text),
    pageCount: options.pageCount,
    fileName: options.fileName,
    isSample: Boolean(options.preferRulesOnly),
    access: "full",
  };
  result.summary =
    result.findings.length > 0
      ? `抓到 ${result.findings.length} 個坑。先處理紅色項目，再談付款、驗收和權利移轉；別只收口頭承諾。`
      : "這份沒有撞上常見地雷，但付款日、驗收期限、修改輪次和權利移轉還是要逐字看清楚。";

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
      isSample: Boolean(options.preferRulesOnly),
      access: "full",
    };
  } catch (caught) {
    console.error("OpenAI contract review failed", caught);
    return {
      ...result,
      usedFallback: true,
      summary: `AI 這次沒接上，先用台灣接案規則庫幫你掃。${result.summary}`,
    };
  }
}
