"use client";

import { useEffect, useState } from "react";
import type { CheckoutProvider } from "@/lib/types";

const PLANS = [
  {
    name: "免費版",
    price: "$0",
    description: "適合偶爾快速檢查",
    features: ["每月 1 份 PDF 初審", "台灣接案風險標註", "基本修改建議"],
    featured: false,
  },
  {
    name: "專業版",
    price: "$19",
    period: "/ 月",
    description: "把審約結果直接變成談判工具",
    features: ["無限合約審閱", "一鍵生成委婉修約信", "條款修改前後對照與複製"],
    featured: true,
  },
] as const;

type CheckoutState = {
  lemonsqueezy: boolean;
  stripe: boolean;
};

export function UpgradeGate() {
  const [loading, setLoading] = useState<CheckoutProvider | "auto" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<CheckoutState | null>(null);

  useEffect(() => {
    fetch("/api/quota")
      .then((response) => response.json())
      .then((data: { checkoutProviders?: CheckoutState }) => {
        setProviders(
          data.checkoutProviders ?? { lemonsqueezy: false, stripe: false },
        );
      })
      .catch(() => setProviders({ lemonsqueezy: false, stripe: false }));
  }, []);

  async function checkout(provider?: CheckoutProvider) {
    setLoading(provider ?? "auto");
    setError(null);
    try {
      const response = await fetch("/api/quota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(provider ? { provider } : {}),
      });
      const data = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "目前無法開啟結帳頁面。");
      }
      window.location.assign(data.checkoutUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "目前無法開啟結帳頁面。");
      setLoading(null);
    }
  }

  const hasLemon = providers?.lemonsqueezy;
  const hasStripe = providers?.stripe;
  const ready = hasLemon || hasStripe;

  return (
    <section
      role="dialog"
      aria-labelledby="upgrade-title"
      aria-modal="true"
      className="mx-auto max-w-4xl rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 text-center shadow-[0_20px_60px_rgba(20,16,12,0.12)] md:p-8"
    >
      <p className="text-xs font-semibold tracking-[0.22em] text-[var(--brass)]">
        免費額度已用完
      </p>
      <h2 id="upgrade-title" className="mt-3 font-serif text-3xl text-[var(--ink)]">
        選擇適合你的審約方案
      </h2>
      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
        本月免費初審已使用。升級後可不限份數審閱，並把風險直接整理成可寄出的修約信。
      </p>

      <div className="mt-7 grid gap-4 text-left md:grid-cols-2">
        {PLANS.map((plan) => (
          <article
            key={plan.name}
            className={`relative rounded-xl border p-5 ${
              plan.featured
                ? "border-[var(--brass)] bg-[var(--wash)]/60"
                : "border-[var(--line)] bg-transparent"
            }`}
          >
            {plan.featured ? (
              <span className="absolute -top-3 right-4 rounded-full bg-[var(--brass)] px-3 py-1 text-[11px] font-semibold text-[var(--paper)]">
                最多人選擇
              </span>
            ) : null}
            <h3 className="font-serif text-xl">{plan.name}</h3>
            <p className="mt-3">
              <span className="text-3xl font-semibold">{plan.price}</span>
              {"period" in plan ? (
                <span className="ml-1 text-sm text-[var(--muted)]">{plan.period}</span>
              ) : null}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">{plan.description}</p>
            <ul className="mt-5 space-y-2 text-sm leading-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="text-[var(--brass)]">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        {ready ? (
          <>
            {hasLemon ? (
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void checkout("lemonsqueezy")}
                className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-medium text-[var(--paper)] disabled:opacity-50"
              >
                {loading === "lemonsqueezy" ? "前往結帳中…" : "以 Lemon Squeezy 升級 $19/月"}
              </button>
            ) : null}
            {hasStripe ? (
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void checkout("stripe")}
                className="rounded-full border border-[var(--ink)] px-6 py-3 text-sm font-medium disabled:opacity-50"
              >
                {loading === "stripe" ? "前往結帳中…" : "以 Stripe 升級"}
              </button>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void checkout()}
            className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-medium text-[var(--paper)] disabled:opacity-50"
          >
            {loading ? "前往結帳中…" : "前往專業版結帳"}
          </button>
        )}
      </div>
      {error ? <p role="alert" className="mt-3 text-sm text-red-800">{error}</p> : null}
      <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
        可隨時取消。升級後仍為 AI／規則庫初審，非正式法律意見。
      </p>
    </section>
  );
}
