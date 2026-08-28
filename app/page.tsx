import { ReviewApp } from "@/components/ReviewApp";
import { hasPaidAccess, hasUsedFreeReview } from "@/lib/quota";

export default async function HomePage() {
  const paid = await hasPaidAccess();
  const quotaUsed = paid ? false : await hasUsedFreeReview();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 md:pt-12">
      <nav className="flex items-center justify-between border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-950 text-xs font-bold text-white dark:bg-white dark:text-zinc-950">
            契
          </span>
          <span className="text-sm font-semibold tracking-tight">契約哨兵</span>
        </div>
        <p className="text-xs text-zinc-500">給台灣接案者的合約檢查工具</p>
      </nav>

      <header className="mb-14 pt-20 text-center md:pt-28">
        <p className="mx-auto inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          繁體中文 · 台灣接案情境 · 30 秒出結果
        </p>
        <h1 className="mt-6 whitespace-nowrap text-[clamp(1.125rem,5.4vw,3.75rem)] font-semibold leading-[1.2] tracking-[-0.04em] text-zinc-950 dark:text-white">
          別再簽「改到滿意為止」的合約了。
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-400 md:text-lg">
          專為台灣設計師、工程師與自由職業者打造。30
          秒抓出著作人格權沒收、無限修改與延期付款陷阱。
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-zinc-500">
          <span>✓ 抓原文，不講空話</span>
          <span>✓ 給談判開場白</span>
          <span>✓ 直接產生替代條款</span>
        </div>
      </header>
      <ReviewApp initialQuotaUsed={quotaUsed} initialPaid={paid} />
    </main>
  );
}
