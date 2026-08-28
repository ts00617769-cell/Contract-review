"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { readPaddleBrowserConfig } from "@/lib/paddle";
import { oneTimePriceId, SUBSCRIPTIONS_ENABLED } from "@/lib/pricing-tiers";

type UpgradeGateProps = {
  onUnlocked?: () => void;
};

const ONE_TIME_PRICE = oneTimePriceId();

export function UpgradeGate({ onUnlocked }: UpgradeGateProps) {
  const paddleRef = useRef<Paddle | null>(null);
  const onUnlockedRef = useRef(onUnlocked);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = useMemo(() => readPaddleBrowserConfig(), []);

  useEffect(() => {
    onUnlockedRef.current = onUnlocked;
  }, [onUnlocked]);

  useEffect(() => {
    if (!config.ok) return;
    let cancelled = false;

    async function confirmPayment(transactionId: string) {
      setLoading(true);
      setError(null);
      try {
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const response = await fetch("/api/billing/unlock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactionId }),
          });
          const data = (await response.json()) as { error?: string };
          if (response.ok) {
            onUnlockedRef.current?.();
            return;
          }
          if (response.status !== 409 || attempt === 5) {
            throw new Error(data.error || "付款已收到，但解鎖失敗。請保留 Paddle 收據。");
          }
          await new Promise((resolve) => window.setTimeout(resolve, 1500));
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "解鎖失敗。");
      } finally {
        setLoading(false);
      }
    }

    void initializePaddle({
      token: config.token,
      environment: config.environment,
      eventCallback: (event) => {
        if (event.name !== "checkout.completed") return;
        const transactionId = event.data?.transaction_id;
        if (typeof transactionId !== "string") return;
        void confirmPayment(transactionId);
      },
    }).then((instance) => {
      if (!cancelled && instance) {
        paddleRef.current = instance;
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [config]);

  function openCheckout() {
    setError(null);
    if (!config.ok) {
      setError(config.error);
      return;
    }
    const paddle = paddleRef.current;
    if (!paddle) {
      setError("結帳元件還在載入，請稍候再點一次。");
      return;
    }
    if (!ONE_TIME_PRICE) {
      setError("尚未設定單次解鎖 Price ID。");
      return;
    }
    paddle.Checkout.open({
      items: [{ priceId: ONE_TIME_PRICE, quantity: 1 }],
      settings: {
        displayMode: "overlay",
        variant: "one-page",
      },
    });
  }

  return (
    <section
      aria-labelledby="upgrade-title"
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          完整報告已鎖定
        </p>
        <h2
          id="upgrade-title"
          className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white"
        >
          解鎖這份合約的完整拆解與修約信
        </h2>
        <p className="mt-3 text-sm leading-7 text-zinc-500">
          一次付清 $2.99，解鎖這一份合約的完整對策與修約信。不自動續訂，下一份需再買。
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <p className="text-sm font-semibold">入門版</p>
          <p className="mt-3 text-3xl font-semibold">$0</p>
          <ul className="mt-5 space-y-2 text-sm text-zinc-500">
            <li>每月 1 份，先看標題與判決</li>
            <li>踩雷範本完整免費</li>
            <li>完整對策需付費</li>
          </ul>
        </article>
        <article className="rounded-xl border border-zinc-950 bg-zinc-950 p-5 text-white dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">單次解鎖</p>
            <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
              一次付清
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            不自動續訂。價格以結帳頁顯示為準。
          </p>
          <ul className="mt-5 space-y-2 text-sm text-zinc-300">
            <li>完整風險報告與修約信</li>
            <li>只解鎖這一份合約</li>
            <li>不自動續訂、不吃到飽</li>
          </ul>
        </article>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          disabled={loading || (config.ok && !ready)}
          onClick={openCheckout}
          className="rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-white dark:text-zinc-950"
        >
          {loading
            ? "確認付款中…"
            : ready || !config.ok
              ? "一次付清，解鎖這份報告"
              : "載入結帳…"}
        </button>
        {SUBSCRIPTIONS_ENABLED ? (
          <Link
            href="/pricing"
            className="rounded-lg border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            查看訂閱方案
          </Link>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-center text-sm text-red-600">
          {error}
        </p>
      ) : !config.ok ? (
        <p role="alert" className="mt-4 text-center text-sm text-red-600">
          {config.error}
        </p>
      ) : null}
    </section>
  );
}
