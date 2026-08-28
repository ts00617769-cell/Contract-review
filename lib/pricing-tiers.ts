export type BillingCycle = "month" | "year";
export type PaidTierName = "專業版" | "大師版";
export type TierName = "入門版" | PaidTierName;

export type FreeTier = {
  name: "入門版";
  description: string;
  features: string[];
  highlighted?: boolean;
  free: true;
};

export type PaidTier = {
  name: PaidTierName;
  description: string;
  features: string[];
  highlighted?: boolean;
  free?: false;
  priceId: { month: string; year: string };
};

export type Tier = FreeTier | PaidTier;

function envPrice(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

/**
 * Paid Price IDs come from Paddle Catalog (`pri_...`) or env vars.
 * 入門版 is free and never goes through Paddle.
 */
export const PRICING_TIERS: Tier[] = [
  {
    name: "入門版",
    free: true,
    description: "先免費拆一份合約，確認工具適不適合你。",
    features: [
      "每月 1 份合約標題與判決",
      "踩雷範本完整免費",
      "不儲存合約內容",
      "完整對策需升級",
    ],
  },
  {
    name: "專業版",
    highlighted: true,
    description: "不限份數分析，接案旺季也不用算額度。",
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
    name: "大師版",
    description: "給工作室或同時接多案的人，量大時優先支援。",
    features: [
      "不限份數完整風險報告",
      "修約信複製與下載",
      "適合多人共用同一裝置流程",
      "後續帳號與歷史紀錄優先支援",
    ],
    priceId: {
      month: envPrice("NEXT_PUBLIC_PADDLE_PRICE_MASTER_MONTH", envPrice("NEXT_PUBLIC_PADDLE_PRICE_ADVANCED_MONTH")),
      year: envPrice("NEXT_PUBLIC_PADDLE_PRICE_MASTER_YEAR", envPrice("NEXT_PUBLIC_PADDLE_PRICE_ADVANCED_YEAR")),
    },
  },
];

export function isPaidTier(tier: Tier): tier is PaidTier {
  return !tier.free;
}

export function allConfiguredPriceIds(): string[] {
  const ids = new Set<string>();
  for (const tier of PRICING_TIERS) {
    if (!isPaidTier(tier)) continue;
    if (tier.priceId.month) ids.add(tier.priceId.month);
    if (tier.priceId.year) ids.add(tier.priceId.year);
  }
  return [...ids];
}
