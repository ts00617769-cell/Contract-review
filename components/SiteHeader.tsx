import Link from "next/link";

export function SiteHeader({ subtitle }: { subtitle?: string }) {
  return (
    <nav className="flex items-center justify-between border-b border-zinc-200 pb-5 dark:border-zinc-800">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-950 text-xs font-bold text-white dark:bg-white dark:text-zinc-950">
          契
        </span>
        <span className="text-sm font-semibold tracking-tight">契約哨兵</span>
      </Link>
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <Link href="/pricing" className="font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300">
          方案
        </Link>
        <p className="hidden sm:block">{subtitle ?? "給台灣接案者的合約檢查工具"}</p>
      </div>
    </nav>
  );
}
