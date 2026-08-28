import Link from "next/link";
import { DISCLAIMER } from "@/lib/disclaimer";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 px-4 py-8 dark:border-zinc-800">
      <nav className="mx-auto mb-4 flex max-w-3xl flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        <Link href="/terms" className="hover:text-zinc-950 dark:hover:text-white">
          服務條款
        </Link>
        <Link href="/privacy" className="hover:text-zinc-950 dark:hover:text-white">
          隱私權政策
        </Link>
        <Link href="/refund" className="hover:text-zinc-950 dark:hover:text-white">
          退款政策
        </Link>
        <Link href="/pricing" className="hover:text-zinc-950 dark:hover:text-white">
          方案與價格
        </Link>
      </nav>
      <p className="mx-auto max-w-3xl text-center text-xs leading-6 text-zinc-500">
        {DISCLAIMER}
      </p>
    </footer>
  );
}
