export type BillingCycle = "month" | "year";

export interface Tier {
  name: "Starter" | "Pro" | "Advanced";
  description: string;
  features: string[];
  highlighted?: boolean;
  priceId: { month: string; year: string };
}

function envPrice(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

/**
 * Edit price IDs here or via env vars (Paddle Catalog → Prices → `pri_...`).
 * Empty IDs hide Subscribe for that interval until you paste a live price.
 */
export const PRICING_TIERS: Tier[] = [
  {
    name: "Starter",
    description: "每月一份完整報告，適合剛開始接案、偶爾才要拆合約。",
    features: [
      "每月 1 份完整風險報告",
      "踩雷原因與談判開場白",
      "替代條款與修約信複製",
      "同一裝置當月可回看",
    ],
    priceId: {
      month: envPrice("NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTH"),
      year: envPrice("NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEAR"),
    },
  },
  {
    name: "Pro",
    description: "不限份數分析，接案旺季也不用算額度。",
    highlighted: true,
    features: [
      "不限份數完整風險報告",
      "修約信複製與下載",
      "替代條款可直接貼回合約",
      "同一裝置本月持續解鎖",
    ],
    priceId: {
      month: envPrice(
        "NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTH",
        envPrice("NEXT_PUBLIC_PADDLE_PRICE_ID", "pri_01m132przkafxjxvmvy5kjrdg3"),
      ),
      year: envPrice("NEXT_PUBLIC_PADDLE_PRICE_PRO_YEAR"),
    },
  },
  {
    name: "Advanced",
    description: "給工作室或同時接多案的人，優先處理量大的合約。",
    features: [
      "不限份數完整風險報告",
      "修約信複製與下載",
      "適合多人共用同一裝置流程",
      "後續帳號與歷史紀錄優先支援",
    ],
    priceId: {
      month: envPrice("NEXT_PUBLIC_PADDLE_PRICE_ADVANCED_MONTH"),
      year: envPrice("NEXT_PUBLIC_PADDLE_PRICE_ADVANCED_YEAR"),
    },
  },
];

export function allConfiguredPriceIds(): string[] {
  const ids = new Set<string>();
  for (const tier of PRICING_TIERS) {
    if (tier.priceId.month) ids.add(tier.priceId.month);
    if (tier.priceId.year) ids.add(tier.priceId.year);
  }
  return [...ids];
}
