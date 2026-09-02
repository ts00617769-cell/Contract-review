import type { Metadata } from "next";
import { headers } from "next/headers";
import { PricingTable } from "@/components/PricingTable";
import { countryFromHeaders } from "@/lib/request-country";

export const metadata: Metadata = {
  title: "方案與價格｜契約哨兵",
  alternates: { canonical: "/pricing" },
  openGraph: { url: "/pricing" },
};

export default async function PricingPage() {
  const headerStore = await headers();
  const countryCode = countryFromHeaders(headerStore);
  const customerEmail = null;

  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-4 pb-20">
      <header className="mx-auto mt-16 max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">方案</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-4xl">
          選一份適合你接案節奏的方案
        </h1>
        <p className="mt-4 text-sm leading-7 text-zinc-500 md:text-base">
          入門版免費看結論。單次解鎖一次付清、只開這一份完整報告。
          經常拆合約可選專業版月繳或年繳，有效期間內同一裝置不限份數。
        </p>
      </header>
      <div className="mt-10">
        <PricingTable countryCode={countryCode} customerEmail={customerEmail} />
      </div>
    </main>
  );
}
