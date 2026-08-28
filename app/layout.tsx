import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: "契約哨兵｜別再簽改到滿意為止的合約",
  description:
    "專為台灣設計師、工程師與自由職業者打造。抓出著作人格權沒收、無限修改與延期付款陷阱。",
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "/",
    siteName: "契約哨兵",
    title: "契約哨兵｜台灣接案合約風險檢查",
    description: "抓出無限修改、延期付款與智慧財產權陷阱，並產生可談判的替代條款。",
  },
  twitter: {
    card: "summary",
    title: "契約哨兵｜台灣接案合約風險檢查",
    description: "抓出無限修改、延期付款與智慧財產權陷阱。",
  },
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
        <a
          href="#main-content"
          className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-0 dark:bg-white dark:text-zinc-950"
        >
          跳到主要內容
        </a>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
