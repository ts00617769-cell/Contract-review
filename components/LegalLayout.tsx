import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 md:pt-12">
      <SiteHeader />
      <article className="mx-auto mt-12 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">契約哨兵</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-xs text-zinc-400">最後更新：{updated}</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          {children}
        </div>
        <p className="mt-10 text-xs text-zinc-400">
          <Link href="/" className="underline underline-offset-4">
            回到首頁
          </Link>
        </p>
      </article>
    </main>
  );
}
