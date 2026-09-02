import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-4 pb-20">
      <section className="mx-auto mt-24 max-w-lg text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">找不到這個頁面</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-500">
          網址可能已變更或輸入錯誤。回首頁上傳合約，或查看目前方案。
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950"
          >
            回到首頁
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-zinc-300 px-5 py-3 text-sm font-semibold dark:border-zinc-700"
          >
            查看方案
          </Link>
        </div>
      </section>
    </main>
  );
}

