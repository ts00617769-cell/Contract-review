import { headers } from "next/headers";
import { PricingTable } from "@/components/PricingTable";
import { SiteHeader } from "@/components/SiteHeader";
import { countryFromHeaders } from "@/lib/request-country";

export default async function PricingPage() {
  const headerStore = await headers();
  const countryCode = countryFromHeaders(headerStore);
  const customerEmail = null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 md:pt-12">
      <SiteHeader />
      <header className="mx-auto mt-16 max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">方案</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-4xl">
          選一份適合你接案節奏的方案
        </h1>
        <p className="mt-4 text-sm leading-7 text-zinc-500 md:text-base">
          價格依所在國家顯示（含稅與否以 Paddle 回傳為準）。付款完成後導向歡迎頁，同一裝置本月解鎖完整報告。
        </p>
      </header>
      <div className="mt-10">
        <PricingTable countryCode={countryCode} customerEmail={customerEmail} />
      </div>
    </main>
  );
}
