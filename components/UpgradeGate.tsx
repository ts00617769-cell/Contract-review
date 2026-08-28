"use client";

import { useEffect, useState } from "react";
import type { CheckoutProvider } from "@/lib/types";

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
      const data = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "目前無法開啟結帳頁面。");
      }
      window.location.assign(data.checkoutUrl);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "目前無法開啟結帳頁面。",
      );
      setLoading(null);
    }
  }

  const hasLemon = providers?.lemonsqueezy;
  const hasStripe = providers?.stripe;
  const hasCheckout = hasLemon || hasStripe;

  return (
    <section
      aria-labelledby="upgrade-title"
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          本月免費額度已用完
        </p>
        <h2
          id="upgrade-title"
          className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white"
        >
          有案子要簽，就別靠猜。
        </h2>
        <p className="mt-3 text-sm leading-7 text-zinc-500">
          升級後不限份數。每一條都給你踩雷原因、談判開場白和可直接貼回去的新條款。
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <p className="text-sm font-semibold">免費</p>
          <p className="mt-3 text-3xl font-semibold">$0</p>
          <ul className="mt-5 space-y-2 text-sm text-zinc-500">
            <li>每月 1 份合約</li>
            <li>基本風險與替代條款</li>
            <li>踩雷範本永久免費</li>
          </ul>
        </article>
        <article className="rounded-xl border border-zinc-950 bg-zinc-950 p-5 text-white dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">專業版</p>
            <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
              Pro
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold">
            $19 <span className="text-sm font-normal text-zinc-400">/ 月</span>
          </p>
          <ul className="mt-5 space-y-2 text-sm text-zinc-300">
            <li>不限份數分析</li>
            <li>老鳥談判開場白</li>
            <li>條款對照與完整修約信</li>
          </ul>
        </article>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {hasCheckout ? (
          <>
            {hasLemon ? (
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void checkout("lemonsqueezy")}
                className="rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-white dark:text-zinc-950"
              >
                {loading === "lemonsqueezy" ? "開啟結帳…" : "升級專業版"}
              </button>
            ) : null}
            {hasStripe ? (
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void checkout("stripe")}
                className="rounded-lg border border-zinc-300 px-5 py-3 text-sm font-semibold hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                {loading === "stripe" ? "開啟結帳…" : "使用 Stripe"}
              </button>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void checkout()}
            className="rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-white dark:text-zinc-950"
          >
            {loading ? "開啟結帳…" : "升級專業版"}
          </button>
        )}
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-center text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </section>
  );
}
