"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="mx-auto w-full max-w-xl px-4 py-24 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">發生錯誤</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">這個頁面暫時無法顯示</h1>
      <p className="mt-4 text-sm leading-7 text-zinc-500">
        請再試一次；若剛完成付款，請保留 Paddle 收據與交易編號。
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950"
      >
        重新載入
      </button>
    </main>
  );
}

