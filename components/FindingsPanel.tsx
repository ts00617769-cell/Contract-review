"use client";

import { useState } from "react";
import { EmailDraftModal } from "@/components/EmailDraftModal";
import { DISCLAIMER_SHORT } from "@/lib/disclaimer";
import { buildEmail } from "@/lib/email-draft";
import type { Finding, ReviewResult, Severity } from "@/lib/types";

const RISK_STYLE: Record<
  Severity,
  { label: string; badge: string; edge: string }
> = {
  high: {
    label: "高風險",
    badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-400",
    edge: "border-l-red-500",
  },
  medium: {
    label: "需注意",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-950 dark:bg-amber-950/40 dark:text-amber-400",
    edge: "border-l-amber-500",
  },
  low: {
    label: "較安全",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-400",
    edge: "border-l-emerald-500",
  },
};

function count(result: ReviewResult, severity: Severity): number {
  return result.findings.filter((item) => item.severity === severity).length;
}

export function FindingsPanel({
  result,
  paid = false,
}: {
  result: ReviewResult;
  paid?: boolean;
}) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const locked = result.access !== "full" || (!paid && !result.isSample);

  function openEmail(findingId?: string) {
    if (locked) return;
    setFocusId(findingId ?? null);
    setEmailOpen(true);
  }

  async function copyClause(item: Finding) {
    if (locked || !item.suggestedClause) return;
    await navigator.clipboard.writeText(item.suggestedClause);
    setCopiedId(item.id);
  }

  function downloadEmail() {
    if (locked) return;
    const draft = buildEmail(result.findings);
    const blob = new Blob([draft], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result.fileName.replace(/\.[^.]+$/, "")}-修約信.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              合約掃描摘要
            </p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
              先看結論
            </h2>
          </div>
          <div className="flex gap-2 text-xs font-semibold">
            <span className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-400">
              {count(result, "high")} 高風險
            </span>
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700 dark:border-amber-950 dark:bg-amber-950/40 dark:text-amber-400">
              {count(result, "medium")} 需注意
            </span>
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-400">
              {count(result, "low")} 較安全
            </span>
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          {result.summary}
        </p>
        <p className="mt-3 text-xs text-zinc-400">
          {result.engine === "openai" ? "AI 深度拆解" : "台灣接案規則庫"}
          {result.usedFallback ? " · 備援模式" : ""}
          {locked ? " · 完整對策已鎖定" : ""}
        </p>
        <p className="mt-2 text-xs leading-5 text-zinc-400">{DISCLAIMER_SHORT}</p>
      </header>

      {result.findings.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-900 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-200">
          沒撞上常見地雷。付款日、驗收期限、修改輪次與權利移轉仍要逐字確認。
        </div>
      ) : null}

      <ol className="space-y-4">
        {result.findings.map((item, index) => {
          const style = RISK_STYLE[item.severity];
          return (
            <li
              key={item.id}
              className={`overflow-hidden rounded-2xl border border-l-4 border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${style.edge}`}
            >
              <div className="p-5 sm:p-6">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 font-mono text-xs text-zinc-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${style.badge}`}
                      >
                        {style.label}
                      </span>
                      {item.ruleId ? (
                        <span className="font-mono text-[11px] text-zinc-400">
                          {item.ruleId}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-zinc-950 dark:text-white">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <p className="mt-4 border-t border-zinc-100 pt-4 text-base font-semibold leading-7 text-zinc-900 dark:border-zinc-900 dark:text-zinc-100">
                  {item.verdict}
                </p>
              </div>

              <div
                className={`${locked ? "pointer-events-none select-none blur-[6px]" : ""}`}
              >
                <section className="border-t border-zinc-200 bg-zinc-50/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/40 sm:p-6">
                  <div className="flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full border border-zinc-300 bg-white font-mono text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
                      1
                    </span>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                      原條款
                    </p>
                  </div>
                  <blockquote className="mt-3 border-l-2 border-zinc-300 pl-4 text-sm leading-7 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                    {item.quote ?? "付費解鎖後顯示原條款定位與完整引用。"}
                  </blockquote>
                </section>
                <div className="relative h-7 border-y border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 text-sm text-zinc-400" aria-hidden>
                    ↓
                  </span>
                </div>
                <section className="bg-red-50/40 p-5 dark:bg-red-950/10 sm:p-6">
                  <div className="flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full border border-red-200 bg-white font-mono text-[10px] text-red-600 dark:border-red-950 dark:bg-zinc-950">
                      2
                    </span>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                      踩雷原因
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                    {item.riskDetail ?? "付費解鎖後顯示這條約定對工時、款項與權利的具體影響。"}
                  </p>
                </section>
                <div className="relative h-7 border-y border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 text-sm text-zinc-400" aria-hidden>
                    ↓
                  </span>
                </div>
                <section className="bg-emerald-50/40 p-5 dark:bg-emerald-950/10 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-5 w-5 place-items-center rounded-full border border-emerald-200 bg-white font-mono text-[10px] text-emerald-700 dark:border-emerald-950 dark:bg-zinc-950">
                        3
                      </span>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                        建議修改版本
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => void copyClause(item)}
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                      {copiedId === item.id ? "已複製改約內容" : "複製改約內容"}
                    </button>
                  </div>
                  <p className="mt-3 rounded-lg border border-emerald-200 bg-white p-4 text-sm leading-7 text-zinc-800 dark:border-emerald-950 dark:bg-zinc-950 dark:text-zinc-200">
                    {item.suggestedClause ?? "付費解鎖後顯示可直接貼回合約的替代條文。"}
                  </p>
                </section>
                <section className="border-t border-zinc-200 p-5 dark:border-zinc-800 sm:p-6">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                    談判時可以這樣說
                  </p>
                  <p className="mt-2 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                    {item.counterMeasure ?? "付費解鎖後顯示可直接對客戶說的談判話術。"}
                  </p>
                </section>
              </div>

              <div className="border-t border-zinc-200 px-5 py-4 text-right dark:border-zinc-800 sm:px-6">
                {locked ? (
                  <p className="text-xs font-medium text-zinc-400">
                    解鎖後可複製條款與下載修約信
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => openEmail(item.id)}
                    className="text-xs font-semibold text-zinc-600 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                  >
                    把這些重點整理成修約信
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {result.findings.length > 0 && !locked ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-white sm:p-6 dark:border-zinc-700">
          <p className="text-lg font-semibold">把風險整理成一封能直接寄出的信</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            把所有紅黃項目整理成一封有立場、但不會撕破臉的修約信。
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => openEmail()}
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
            >
              一鍵生成委婉修約信
            </button>
            <button
              type="button"
              onClick={downloadEmail}
              className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              下載修約信
            </button>
          </div>
        </section>
      ) : null}

      {emailOpen && !locked ? (
        <EmailDraftModal
          open
          findings={result.findings}
          focusId={focusId}
          allowDownload
          onClose={() => setEmailOpen(false)}
        />
      ) : null}
    </div>
  );
}
