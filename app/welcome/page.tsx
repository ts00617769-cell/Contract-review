import type { Metadata } from "next";
import { WelcomeClient } from "@/components/WelcomeClient";
import { hasPaidAccess } from "@/lib/quota";

export const metadata: Metadata = {
  title: "付款狀態｜契約哨兵",
  robots: { index: false, follow: false },
  openGraph: { url: "/welcome" },
};

type WelcomePageProps = {
  searchParams: Promise<{ _ptxn?: string }>;
};

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const params = await searchParams;
  const paid = await hasPaidAccess();
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-4 pb-20">
      <WelcomeClient transactionId={params._ptxn} alreadyPaid={paid} />
    </main>
  );
}
