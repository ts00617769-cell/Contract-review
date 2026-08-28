import type { PaidPlan } from "@/lib/quota";

export type BillingCycle = "month" | "year";
export type PaidTierName = "專業版";
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

export const SUBSCRIPTIONS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS === "true";

function envPrice(
  name:
    | "NEXT_PUBLIC_PADDLE_PRICE_ONETIME"
    | "NEXT_PUBLIC_PADDLE_PRICE_ID"
    | "NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTH"
    | "NEXT_PUBLIC_PADDLE_PRICE_PRO_YEAR",
  fallback = "",
): string {
  const values = {
    NEXT_PUBLIC_PADDLE_PRICE_ONETIME:
      process.env.NEXT_PUBLIC_PADDLE_PRICE_ONETIME,
    NEXT_PUBLIC_PADDLE_PRICE_ID: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID,
    NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTH:
      process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTH,
    NEXT_PUBLIC_PADDLE_PRICE_PRO_YEAR:
      process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_YEAR,
  };
  return values[name]?.trim() || fallback;
}

const ONE_TIME_PRICE =
  envPrice("NEXT_PUBLIC_PADDLE_PRICE_ONETIME") ||
  envPrice("NEXT_PUBLIC_PADDLE_PRICE_ID");

/**
 * Paid Price IDs come from Paddle Catalog (`pri_...`) or env vars.
 * 入門版 is free. 單次解鎖 is a one-time Paddle price. 專業版 is the subscription.
 */
export const PRICING_TIERS: Tier[] = [
  {
    name: "入門版",
    free: true,
    description: "免費看結論。完整對策、替代條款與修約信需付費解鎖。",
    features: [
      "每月 1 份分析，先看標題與判決",
      "踩雷範本完整免費、不扣額度",
      "分析當下處理，不以合約訓練模型",
      "完整對策需單次解鎖或訂閱",
    ],
  },
  {
    name: "單次解鎖",
    oneTime: true,
    highlighted: true,
    description: "一次付清、不自動續訂。只解鎖這一份合約的完整報告。",
    features: [
      "完整風險報告、替代條款與修約信",
      "一次付清，不會每月扣款",
      "只適用這一次分析，不是吃到飽",
      "下一份合約需再次解鎖",
    ],
    priceId: ONE_TIME_PRICE,
  },
  ...(SUBSCRIPTIONS_ENABLED
    ? [
        {
          name: "專業版" as const,
          description: "訂閱制。適合經常拆合約；年繳同一裝置約一年有效。",
          features: [
            "完整風險報告、替代條款與修約信",
            "有效期間不限分析份數",
            "月繳約 31 天；年繳約 366 天",
            "到期是否續扣由 Paddle 訂閱管理",
          ],
          priceId: {
            month: envPrice(
              "NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTH",
            ),
            year: envPrice(
              "NEXT_PUBLIC_PADDLE_PRICE_PRO_YEAR",
            ),
          },
        },
      ]
    : []),
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

export function planFromPriceId(priceId: string | undefined): PaidPlan | null {
  if (!priceId) return null;
  const oneTime = oneTimePriceId();
  const pro = PRICING_TIERS.find(isSubscriptionTier);
  if (oneTime && priceId === oneTime) return "onetime";
  if (pro && priceId === pro.priceId.year) return "year";
  if (pro && priceId === pro.priceId.month) return "month";
  return null;
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
