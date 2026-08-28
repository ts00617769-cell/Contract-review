import { SiteHeader } from "@/components/SiteHeader";
import { WelcomeClient } from "@/components/WelcomeClient";
import { hasPaidAccess } from "@/lib/quota";

type WelcomePageProps = {
  searchParams: Promise<{ _ptxn?: string }>;
};

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const params = await searchParams;
  const paid = await hasPaidAccess();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 md:pt-12">
      <SiteHeader />
      <WelcomeClient transactionId={params._ptxn} alreadyPaid={paid} />
    </main>
  );
}
