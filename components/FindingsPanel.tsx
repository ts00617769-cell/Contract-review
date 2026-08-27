"use client";

import { useState } from "react";
import { EmailDraftModal } from "@/components/EmailDraftModal";
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
  const [emailOpen, setEmailOpen] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function openEmail(findingId?: string) {
    setFocusId(findingId ?? null);
    setEmailOpen(true);
  }

  async function copySuggestion(item: Finding) {
    await navigator.clipboard.writeText(item.suggestion);
    setCopiedId(item.id);
  }

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

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-lg border border-red-200 bg-red-50/70 p-3 text-sm leading-6 text-red-950">
                      <p className="text-[11px] font-semibold tracking-widest text-red-700">
                        修改前
                      </p>
                      <p className="mt-1 line-through decoration-red-600/70 decoration-2">
                        {item.quote}
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-sm leading-6 text-emerald-950">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold tracking-widest text-emerald-800">
                          建議修改後
                        </p>
                        <button
                          type="button"
                          onClick={() => void copySuggestion(item)}
                          className="shrink-0 rounded-full border border-emerald-700/30 px-3 py-1 text-[11px] font-semibold text-emerald-900"
                        >
                          {copiedId === item.id ? "已複製" : "複製修改後條款"}
                        </button>
                      </div>
                      <p className="mt-2">{item.suggestion}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => openEmail(item.id)}
                      className="rounded-full border border-[var(--ink)] px-4 py-2 text-xs font-semibold transition hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                    >
                      一鍵生成回覆客戶信件
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ),
      )}

      {result.findings.length > 0 ? (
        <section className="rounded-xl border border-[var(--brass)] bg-[var(--wash)]/70 p-5 text-center">
          <p className="font-serif text-xl">把風險清單變成能寄出的修約信</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            自動整合所有高、中風險，整理成禮貌且具說服力的談判文字。
          </p>
          <button
            type="button"
            onClick={() => openEmail()}
            className="mt-4 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--paper)]"
          >
            一鍵生成回覆客戶信件
          </button>
        </section>
      ) : null}

      {emailOpen ? (
        <EmailDraftModal
          open
          findings={result.findings}
          focusId={focusId}
          onClose={() => setEmailOpen(false)}
        />
      ) : null}
    </div>
  );
}
