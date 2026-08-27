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
        <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight md:text-5xl">
          把客戶丟來的 PDF
          <br />
          先標出不該默默簽名的句子。
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">
          給台灣接案設計師與行銷顧問的合約 AI 初審。上傳 PDF 後，標註不對等條款、模糊付款與智財轉讓陷阱，並附上修改建議。沒有
          API 金鑰時改走在地規則庫。
        </p>
        <ul className="mt-8 grid gap-3 text-sm md:grid-cols-3">
          {[
            ["不對等", "隨時終止、無限修改、無限賠償、過寬競業"],
            ["付款", "滿意後才付、先發票、長帳期、KPI 保證"],
            ["智財", "未付款就轉讓、原始檔、未採用稿、禁作品集"],
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
