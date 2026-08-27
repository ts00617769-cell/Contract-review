import { TAIWAN_FREELANCER_RULES } from "./rules";
import type { Finding } from "./types";

function snippetAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + length + 80);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

export function scanWithRuleLibrary(rawText: string): Finding[] {
  const text = rawText.replace(/\u0000/g, "");
  const findings: Finding[] = [];

  for (const rule of TAIWAN_FREELANCER_RULES) {
    if (rule.absent) {
      const patterns = rule.absencePatterns ?? [];
      const hit = patterns.some((pattern) => pattern.test(text));
      if (!hit) {
        findings.push({
          id: `rule-${rule.id}`,
          category: rule.category,
          severity: rule.severity,
          title: rule.title || `缺漏：${rule.id}`,
          quote: "（全文未見相關約定）",
          why: rule.why,
          suggestion: rule.suggestion,
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
          id: `rule-${rule.id}`,
          category: rule.category,
          severity: rule.severity,
          title: rule.title,
          quote: snippetAround(text, match.index, match[0].length),
          why: rule.why,
          suggestion: rule.suggestion,
          ruleId: rule.id,
        });
        break;
      }
    }
  }

  const rank = { high: 0, medium: 1, low: 2 };
  return findings.sort((a, b) => rank[a.severity] - rank[b.severity]);
}
