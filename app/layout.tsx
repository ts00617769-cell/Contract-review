import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import { DISCLAIMER } from "@/lib/disclaimer";
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
  title: "契約哨兵｜別再簽改到滿意為止的合約",
  description:
    "專為台灣設計師、工程師與自由職業者打造。30 秒抓出著作人格權沒收、無限修改與延期付款陷阱。",
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
        {children}
        <footer className="mt-auto border-t border-zinc-200 px-4 py-8 dark:border-zinc-800">
          <p className="mx-auto max-w-3xl text-center text-xs leading-6 text-zinc-500">
            {DISCLAIMER}
          </p>
        </footer>
      </body>
    </html>
  );
}
