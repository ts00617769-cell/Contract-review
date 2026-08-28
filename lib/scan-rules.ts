import { TAIWAN_FREELANCER_RULES } from "./rules";
import type { ContractRule } from "./rules";
import type { Finding } from "./types";

function snippetAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + length + 80);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function verdictFor(rule: ContractRule): string {
  if (rule.verdict) return rule.verdict;
  if (rule.severity === "high") {
    return `「${rule.title}」不是小字問題，簽下去就是你扛全部成本。`;
  }
  if (rule.severity === "medium") {
    return `「${rule.title}」現在不講清楚，出事時一定是接案方吃虧。`;
  }
  return `這段可以再寫清楚，別把解釋空間全留給對方。`;
}

function counterMeasureFor(rule: ContractRule): string {
  return (
    rule.counterMeasure ??
    `你可以說：「這一段會讓執行範圍不確定，我希望把${rule.title}的界線直接寫進合約；口頭共識之後很難對。」`
  );
}

function toFinding(
  rule: ContractRule,
  quote: string,
): Omit<Finding, "id" | "ruleId"> {
  return {
    category: rule.category,
    severity: rule.severity,
    title: rule.title,
    quote,
    verdict: verdictFor(rule),
    riskDetail: rule.why,
    counterMeasure: counterMeasureFor(rule),
    suggestedClause: rule.suggestion.replace(/^建議(?:改為|加入|補上)?[：:]\s*/, ""),
  };
}

export function scanWithRuleLibrary(rawText: string): Finding[] {
  const text = rawText.replace(/\u0000/g, "");
  const canInferMissingClauses = text.replace(/\s/g, "").length >= 300;
  const findings: Finding[] = [];

  for (const rule of TAIWAN_FREELANCER_RULES) {
    if (rule.absent) {
      if (!canInferMissingClauses) continue;
      const patterns = rule.absencePatterns ?? [];
      const hit = patterns.some((pattern) => pattern.test(text));
      const contextPatterns = rule.contextPatterns ?? [];
      const hasRequiredContext =
        contextPatterns.length === 0 ||
        contextPatterns.some((pattern) => pattern.test(text));
      if (!hit && hasRequiredContext) {
        findings.push({
          ...toFinding(rule, "（全文未見相關約定）"),
          id: `rule-${rule.id}`,
          ruleId: rule.id,
        });
      }
      continue;
    }

    if (!rule.patterns) continue;

    for (const pattern of rule.patterns) {
      const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
      const global = new RegExp(pattern.source, flags);
      const match = global.exec(text);
      if (match && match.index >= 0) {
        findings.push({
          ...toFinding(rule, snippetAround(text, match.index, match[0].length)),
          id: `rule-${rule.id}`,
          ruleId: rule.id,
        });
        break;
      }
    }
  }

  const rank = { high: 0, medium: 1, low: 2 };
  return findings.sort((a, b) => rank[a.severity] - rank[b.severity]);
}
