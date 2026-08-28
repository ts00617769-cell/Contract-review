export type BillingCycle = "month" | "year";
export type PaidTierName = "專業版" | "大師版";
export type TierName = "入門版" | "單次解鎖" | PaidTierName;

export type FreeTier = {
  name: "入門版";
  description: string;
  features: string[];
  highlighted?: boolean;
  free: true;
};

export type OneTimeTier = {
  name: "單次解鎖";
  description: string;
  features: string[];
  highlighted?: boolean;
  oneTime: true;
  priceId: string;
};

export type SubscriptionTier = {
  name: PaidTierName;
  description: string;
  features: string[];
  highlighted?: boolean;
  priceId: { month: string; year: string };
};

export type Tier = FreeTier | OneTimeTier | SubscriptionTier;

function envPrice(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

const ONE_TIME_PRICE =
  envPrice("NEXT_PUBLIC_PADDLE_PRICE_ONETIME") ||
  envPrice("NEXT_PUBLIC_PADDLE_PRICE_ID") ||
  "pri_01m132przkafxjxvmvy5kjrdg3";

/**
 * Paid Price IDs come from Paddle Catalog (`pri_...`) or env vars.
 * 入門版 is free. 單次解鎖 is a one-time Paddle price. 專業版／大師版 are subscriptions.
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
    name: "單次解鎖",
    oneTime: true,
    highlighted: true,
    description: "只解鎖這次分析，適合偶爾才要拆合約。",
    features: [
      "這份合約的完整風險報告",
      "修約信複製與下載",
      "一次付清，不自動續訂",
      "同一裝置本月可持續查看",
    ],
    priceId: ONE_TIME_PRICE,
  },
  {
    name: "專業版",
    description: "不限份數分析，接案旺季也不用算額度。",
    features: [
      "不限份數完整風險報告",
      "修約信複製與下載",
      "替代條款可直接貼回合約",
      "同一裝置本月持續解鎖",
    ],
    priceId: {
      month: envPrice("NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTH"),
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

export function isFreeTier(tier: Tier): tier is FreeTier {
  return "free" in tier && tier.free === true;
}

export function isOneTimeTier(tier: Tier): tier is OneTimeTier {
  return "oneTime" in tier && tier.oneTime === true;
}

export function isSubscriptionTier(tier: Tier): tier is SubscriptionTier {
  return !isFreeTier(tier) && !isOneTimeTier(tier);
}

export function oneTimePriceId(): string {
  return ONE_TIME_PRICE;
}

export function checkoutPriceId(tier: Tier, cycle: BillingCycle): string {
  if (isFreeTier(tier)) return "";
  if (isOneTimeTier(tier)) return tier.priceId;
  return tier.priceId[cycle];
}

export function allConfiguredPriceIds(): string[] {
  const ids = new Set<string>();
  for (const tier of PRICING_TIERS) {
    if (isFreeTier(tier)) continue;
    if (isOneTimeTier(tier)) {
      if (tier.priceId) ids.add(tier.priceId);
      continue;
    }
    if (tier.priceId.month) ids.add(tier.priceId.month);
    if (tier.priceId.year) ids.add(tier.priceId.year);
  }
  return [...ids];
}
