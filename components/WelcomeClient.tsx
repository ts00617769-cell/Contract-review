"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    void fetch("/api/billing/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId }),
    })
      .then(async (response) => {
        const data = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(data.error || "解鎖失敗。");
        if (!cancelled) setStatus("ok");
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(caught instanceof Error ? caught.message : "解鎖失敗。");
      });
    return () => {
      cancelled = true;
    };
  }, [alreadyPaid, transactionId]);

  return (
    <div className="mx-auto mt-24 max-w-lg text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Welcome</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">方案已就緒</h1>
      <p className="mt-4 text-sm leading-7 text-zinc-500">
        {status === "unlocking"
          ? "正在確認付款並解鎖完整報告…"
          : status === "ok"
            ? "這台裝置本月可以不限份數拆合約。回到首頁上傳或貼上合約即可。"
            : "若你剛完成付款，解鎖會在確認後生效。也可以直接回首頁繼續用免費額度。"}
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
