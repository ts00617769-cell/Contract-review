import type { Finding, FindingCategory, ReviewResult } from "@/lib/types";

const LABELS: Record<FindingCategory, string> = {
  unfair: "不對等條款",
  payment: "模糊付款",
  ip: "智財轉讓陷阱",
};

const SEVERITY: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

function group(findings: Finding[]) {
  return (["unfair", "payment", "ip"] as FindingCategory[]).map((category) => ({
    category,
    items: findings.filter((item) => item.category === category),
  }));
}

export function FindingsPanel({ result }: { result: ReviewResult }) {
  const groups = group(result.findings);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4">
        <p className="text-xs font-medium tracking-[0.18em] text-[var(--brass)] uppercase">
          初審摘要
        </p>
        <p className="mt-2 text-[15px] leading-7 text-[var(--ink)]">{result.summary}</p>
        <p className="mt-3 text-xs text-[var(--muted)]">
          引擎：{result.engine === "openai" ? "OpenAI 結構化輸出" : "台灣接案規則庫"}
          {result.usedFallback ? "（fallback）" : ""}
        </p>
      </div>

      {result.findings.length === 0 ? (
        <p className="text-sm leading-6 text-[var(--muted)]">
          這次沒有標到常見陷阱，不代表合約安全。請特別人工檢查付款、驗收、智財與終止條款。
        </p>
      ) : null}

      {groups.map(({ category, items }) =>
        items.length === 0 ? null : (
          <section key={category}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide">
              <span className="h-2 w-2 rounded-full bg-[var(--signal)]" />
              {LABELS[category]}
              <span className="text-[var(--muted)]">({items.length})</span>
            </h3>
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--signal-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--signal)]">
                      {SEVERITY[item.severity]}風險
                    </span>
                    {item.ruleId ? (
                      <span className="font-mono text-[11px] text-[var(--muted)]">
                        {item.ruleId}
                      </span>
                    ) : null}
                    <h4 className="text-[15px] font-semibold text-[var(--ink)]">
                      {item.title}
                    </h4>
                  </div>
                  <p className="mt-3 border-l-2 border-[var(--brass)] pl-3 text-sm leading-6 text-[var(--muted)]">
                    「{item.quote}」
                  </p>
                  <p className="mt-3 text-sm leading-6">{item.why}</p>
                  <div className="mt-3 rounded-md bg-[var(--wash)] p-3 text-sm leading-6">
                    <p className="text-[11px] font-semibold tracking-widest text-[var(--brass)]">
                      修改建議
                    </p>
                    <p className="mt-1">{item.suggestion}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ),
      )}
    </div>
  );
}
