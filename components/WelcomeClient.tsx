"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SUBSCRIPTIONS_ENABLED } from "@/lib/pricing-tiers";

export function WelcomeClient({
  transactionId,
  alreadyPaid,
}: {
  transactionId?: string;
  alreadyPaid: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "unlocking" | "ok" | "error">(
    alreadyPaid ? "ok" : transactionId ? "unlocking" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (alreadyPaid || !transactionId) return;
    let cancelled = false;

    async function unlock() {
      for (let attempt = 0; attempt < 6 && !cancelled; attempt += 1) {
        const response = await fetch("/api/billing/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionId }),
        });
        const data = (await response.json()) as { error?: string };
        if (response.ok) {
          setStatus("ok");
          window.history.replaceState({}, "", "/welcome");
          return;
        }
        if (response.status !== 409 || attempt === 5) {
          throw new Error(data.error || "解鎖失敗。");
        }
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }
    }

    void unlock().catch((caught: unknown) => {
      if (cancelled) return;
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "解鎖失敗。");
    });
    return () => {
      cancelled = true;
    };
  }, [alreadyPaid, transactionId]);

  const heading =
    status === "ok"
      ? "解鎖已生效"
      : status === "unlocking"
        ? "正在確認付款"
        : status === "error"
          ? "解鎖尚未完成"
          : "尚未收到交易資訊";

  return (
    <div className="mx-auto mt-24 max-w-lg text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">付款狀態</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{heading}</h1>
      <p className="mt-4 text-sm leading-7 text-zinc-500">
        {status === "unlocking"
          ? "正在向 Paddle 確認交易，通常幾秒內完成，請勿關閉此頁。"
          : status === "ok"
            ? SUBSCRIPTIONS_ENABLED
              ? "這台瀏覽器在有效期間內可不限份數查看完整報告。31 天解鎖與月繳約 31 天，年繳約一年。換裝置或清除 Cookie 後可能需要重新解鎖。"
              : "這台瀏覽器約 31 天內可不限份數查看完整報告。換裝置或清除 Cookie 後可能需要重新解鎖。"
            : status === "error"
              ? "系統目前無法確認這筆交易。請保留 Paddle 收據與交易編號，稍後重新開啟收據中的返回連結。"
              : "此頁沒有交易編號，因此尚未變更你的方案。若已付款，請從 Paddle 結帳完成頁或收據中的連結返回。"}
      </p>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <Link
        href="/"
        className="mt-8 inline-flex rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950"
      >
        回到首頁開始拆合約
      </Link>
    </div>
  );
}
