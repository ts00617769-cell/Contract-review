import { ReviewApp } from "@/components/ReviewApp";
import { SiteHeader } from "@/components/SiteHeader";
import { hasPaidAccess, hasUsedFreeReview } from "@/lib/quota";

export default async function HomePage() {
  const paid = await hasPaidAccess();
  const quotaUsed = paid ? false : await hasUsedFreeReview();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 md:pt-12">
      <SiteHeader />

      <header className="mx-auto mb-12 max-w-4xl pt-16 text-center md:mb-16 md:pt-24">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm shadow-zinc-950/[0.03] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          繁體中文 · 台灣接案情境 · 約 30 秒
        </p>
        <h1 className="mt-6 whitespace-nowrap text-[clamp(1.125rem,5.4vw,3.75rem)] font-semibold leading-[1.15] tracking-[-0.045em] text-zinc-950 dark:text-white">
          別再簽「改到滿意為止」的合約了。
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-400 md:text-lg md:leading-8">
          上傳合約，直接標出著作人格權、無限修改與延期付款陷阱。
          不只告訴你哪裡有問題，也給你能直接貼回去的修改版本。
        </p>
        <div className="mt-8 flex flex-wrap justify-center divide-x divide-zinc-200 text-xs font-medium text-zinc-500 dark:divide-zinc-800">
          <span className="px-3 first:pl-0">抓出原文</span>
          <span className="px-3">解釋風險</span>
          <span className="px-3 last:pr-0">產生替代條款</span>
        </div>
      </header>
      <ReviewApp initialQuotaUsed={quotaUsed} initialPaid={paid} />
    </main>
  );
}
