import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import { DISCLAIMER, DISCLAIMER_SHORT } from "@/lib/disclaimer";
import "./globals.css";

const sans = Noto_Sans_TC({
  variable: "--font-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const serif = Noto_Serif_TC({
  variable: "--font-serif-tc",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "契約哨兵｜台灣接案者專屬合約避坑 AI",
  description:
    "30 秒抓出著作權陷阱、無限修改與延期付款，並一鍵生成委婉修約回信。支援繁體中文，比對台灣民法與著作權常見爭議。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="zh-Hant"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <div className="border-b border-[var(--line)] bg-[var(--ink)] px-4 py-2.5 text-center text-[11px] leading-5 tracking-wide text-[var(--paper)]">
          {DISCLAIMER_SHORT}
        </div>
        {children}
        <footer className="mt-auto border-t border-[var(--line)] px-4 py-8">
          <p className="mx-auto max-w-3xl text-center text-xs leading-6 text-[var(--muted)]">
            {DISCLAIMER}
          </p>
        </footer>
      </body>
    </html>
  );
}
