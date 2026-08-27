import { ReviewApp } from "@/components/ReviewApp";
import { hasUsedFreeReview } from "@/lib/quota";

export default async function HomePage() {
  const quotaUsed = await hasUsedFreeReview();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:py-16">
      <header className="mb-12">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-10 w-10 place-items-center rounded-full border border-[var(--brass)] text-[var(--brass)]"
          >
            哨
          </span>
          <p className="text-sm tracking-[0.28em] text-[var(--brass)]">契約哨兵</p>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          台灣接案者專屬合約防雷工具，30 秒抓出智財權與付款陷阱。
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight md:text-5xl">
          專為自由職業者與接案團隊打造的
          <br />
          「合約避坑 AI」
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">
          30 秒抓出著作權陷阱、無限修改條款與延期付款，並一鍵生成委婉修約回信。
        </p>
        <p className="mt-3 inline-flex rounded-full border border-[var(--line)] bg-[var(--paper)]/80 px-3 py-1 text-xs text-[var(--muted)]">
          支援繁體中文合約 · 比對台灣民法與著作權常見爭議
        </p>
        <ul className="mt-8 grid gap-3 text-sm md:grid-cols-3">
          {[
            ["不對等", "無限修改、無驗收期限、過寬競業"],
            ["付款", "結算後 90 天、缺少訂金、先發票"],
            ["智財", "著作人格權拋棄、未付清就移轉"],
          ].map(([title, detail]) => (
            <li
              key={title}
              className="rounded-xl border border-[var(--line)] bg-[var(--paper)]/80 px-4 py-3"
            >
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-[var(--muted)]">{detail}</p>
            </li>
          ))}
        </ul>
      </header>
      <ReviewApp initialQuotaUsed={quotaUsed} />
    </main>
  );
}
