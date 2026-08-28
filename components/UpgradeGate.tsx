"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useEffect, useRef, useState } from "react";
import { PADDLE_PRICE_ID, paddleEnvironment } from "@/lib/paddle";

const CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim() ?? "";

type UpgradeGateProps = {
  onUnlocked?: () => void;
};

export function UpgradeGate({ onUnlocked }: UpgradeGateProps) {
  const paddleRef = useRef<Paddle | null>(null);
  const onUnlockedRef = useRef(onUnlocked);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onUnlockedRef.current = onUnlocked;
  }, [onUnlocked]);

  useEffect(() => {
    if (!CLIENT_TOKEN) return;
    let cancelled = false;

    async function confirmPayment(transactionId: string) {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/billing/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionId }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error || "付款已收到，但解鎖失敗。請重新整理後再試。");
        }
        onUnlockedRef.current?.();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "解鎖失敗。");
      } finally {
        setLoading(false);
      }
    }

    void initializePaddle({
      token: CLIENT_TOKEN,
      environment: paddleEnvironment(),
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
  }, []);

  function openCheckout() {
    setError(null);
    if (!CLIENT_TOKEN) {
      setError(
        "尚未設定 NEXT_PUBLIC_PADDLE_CLIENT_TOKEN。請到 Vercel 環境變數貼上 Paddle Client-side Token。",
      );
      return;
    }
    const paddle = paddleRef.current;
    if (!paddle) {
      setError("結帳元件還在載入，請稍候再點一次。");
      return;
    }
    paddle.Checkout.open({
      items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }],
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
          付款完成後立刻打開踩雷原因、談判開場白、替代條款，並可下載修約信。同一裝置本月不限份數。
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <p className="text-sm font-semibold">預覽</p>
          <p className="mt-3 text-3xl font-semibold">$0</p>
          <ul className="mt-5 space-y-2 text-sm text-zinc-500">
            <li>每月 1 份合約標題與判決</li>
            <li>踩雷範本完整免費</li>
            <li>完整對策需解鎖</li>
          </ul>
        </article>
        <article className="rounded-xl border border-zinc-950 bg-zinc-950 p-5 text-white dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">專業版</p>
            <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
              Paddle
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold">
            $19 <span className="text-sm font-normal text-zinc-400">/ 月</span>
          </p>
          <ul className="mt-5 space-y-2 text-sm text-zinc-300">
            <li>完整風險報告</li>
            <li>修約信複製與下載</li>
            <li>不限份數分析</li>
          </ul>
        </article>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          disabled={loading || (Boolean(CLIENT_TOKEN) && !ready)}
          onClick={openCheckout}
          className="rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-white dark:text-zinc-950"
        >
          {loading
            ? "確認付款中…"
            : ready || !CLIENT_TOKEN
              ? "用 Paddle 解鎖完整報告"
              : "載入結帳…"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-center text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </section>
  );
}
