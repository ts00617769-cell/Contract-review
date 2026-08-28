"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-Hant">
      <body>
        <main style={{ margin: "6rem auto", maxWidth: "32rem", padding: "1rem", textAlign: "center" }}>
          <h1>網站暫時無法使用</h1>
          <p>請稍後重試；若問題持續發生，請保留畫面與付款收據。</p>
          <button type="button" onClick={reset}>
            重新載入
          </button>
        </main>
      </body>
    </html>
  );
}

