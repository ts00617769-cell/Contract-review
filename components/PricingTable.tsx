"use client";

import { initializePaddle, type CountryCode, type Paddle } from "@paddle/paddle-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { readPaddleBrowserConfig } from "@/lib/paddle";
import {
  PRICING_TIERS,
  SUBSCRIPTIONS_ENABLED,
  checkoutPriceId,
  isFreeTier,
  isOneTimeTier,
  type BillingCycle,
  type Tier,
} from "@/lib/pricing-tiers";

type PriceMap = Record<string, string>;

type PricingTableProps = {
  countryCode?: string;
  customerEmail?: string | null;
};

export function PricingTable({ countryCode, customerEmail }: PricingTableProps) {
  const router = useRouter();
  const paddleRef = useRef<Paddle | null>(null);
  const config = useMemo(() => readPaddleBrowserConfig(), []);
  const [cycle, setCycle] = useState<BillingCycle>("month");
  const [ready, setReady] = useState(false);
  const [prices, setPrices] = useState<PriceMap>({});
  const [loadingPrices, setLoadingPrices] = useState(config.ok);
  const [error, setError] = useState<string | null>(config.ok ? null : config.error);

  const itemsForPreview = useMemo(() => {
    const ids = new Set<string>();
    for (const id of PRICING_TIERS.flatMap((tier) => {
      if (isFreeTier(tier)) return [];
      if (isOneTimeTier(tier)) return tier.priceId ? [tier.priceId] : [];
      return [tier.priceId.month, tier.priceId.year].filter(Boolean);
    })) {
      ids.add(id);
    }
    return [...ids].map((priceId) => ({ priceId, quantity: 1 }));
  }, []);

  useEffect(() => {
    if (!config.ok) return;
    let cancelled = false;

    void initializePaddle({
      token: config.token,
      environment: config.environment,
      eventCallback: (event) => {
        if (event.name !== "checkout.completed") return;
        const transactionId = event.data?.transaction_id;
        if (typeof transactionId !== "string") return;
        router.push(`/welcome?_ptxn=${encodeURIComponent(transactionId)}`);
      },
    }).then(async (instance) => {
      if (cancelled || !instance) return;
      paddleRef.current = instance;
      setReady(true);

      if (itemsForPreview.length === 0) {
        setLoadingPrices(false);
        setError("尚未設定任何付費 Price ID。");
        return;
      }

      try {
        const preview = await instance.PricePreview({
          items: itemsForPreview,
          ...(countryCode
            ? { address: { countryCode: countryCode as CountryCode } }
            : {}),
        });
        const next: PriceMap = {};
        for (const line of preview.data.details.lineItems) {
          next[line.price.id] = line.formattedTotals.total;
        }
        if (!cancelled) {
          setPrices(next);
          setError(null);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "無法載入價格。請確認 Default payment link 與網域審核。",
          );
        }
      } finally {
        if (!cancelled) setLoadingPrices(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [config, countryCode, itemsForPreview, router]);

  function openCheckout(tier: Tier) {
    setError(null);
    if (isFreeTier(tier)) return;
    if (!config.ok) {
      setError(config.error);
      return;
    }
    const priceId = checkoutPriceId(tier, cycle);
    if (!priceId) {
      setError(
        `${tier.name} 尚未設定${isOneTimeTier(tier) ? "單次" : cycle === "month" ? "月繳" : "年繳"} Price ID。`,
      );
      return;
    }
    const paddle = paddleRef.current;
    if (!paddle) {
      setError("結帳元件還在載入，請稍候再點一次。");
      return;
    }

    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      ...(customerEmail ? { customer: { email: customerEmail } } : {}),
      settings: {
        displayMode: "overlay",
        variant: "one-page",
        successUrl: `${window.location.origin}/welcome`,
      },
    });
  }

  return (
    <div>
      {SUBSCRIPTIONS_ENABLED ? (
        <>
          <div className="flex justify-center">
            <div
              role="group"
              aria-label="專業版計費週期"
              className="inline-flex rounded-lg bg-zinc-100 p-1 text-sm dark:bg-zinc-900"
            >
              {(
                [
                  ["month", "月繳"],
                  ["year", "年繳"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={cycle === value}
                  onClick={() => setCycle(value)}
                  className={`rounded-md px-4 py-2 font-medium transition ${
                    cycle === value
                      ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-zinc-400">
            月繳／年繳只影響專業版。31 天解鎖不續訂。
          </p>
        </>
      ) : (
        <p className="text-center text-xs text-zinc-400">
          31 天解鎖為一次付清、不自動續訂。
        </p>
      )}

      <div
        className={`mx-auto mt-8 grid max-w-4xl gap-4 ${
          SUBSCRIPTIONS_ENABLED ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        {PRICING_TIERS.map((tier) => {
          const priceId = checkoutPriceId(tier, cycle);
          const amount = priceId ? prices[priceId] : undefined;
          return (
            <article
              key={tier.name}
              className={`flex flex-col rounded-2xl border p-6 ${
                tier.highlighted
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-600"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{tier.name}</h2>
                {isOneTimeTier(tier) ? (
                  <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
                    一次
                  </span>
                ) : isFreeTier(tier) ? (
                  <span className="rounded-md border border-zinc-200 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:border-zinc-700">
                    免費
                  </span>
                ) : (
                  <span className="rounded-md border border-zinc-200 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:border-zinc-700">
                    訂閱
                  </span>
                )}
              </div>
              <p
                className={`mt-2 text-sm leading-6 ${
                  tier.highlighted ? "text-zinc-300" : "text-zinc-500"
                }`}
              >
                {tier.description}
              </p>
              <p className="mt-6 text-3xl font-semibold tracking-tight">
                {isFreeTier(tier) ? (
                  <>
                    $0
                    <span className="ml-1 text-sm font-normal text-zinc-500">/ 月</span>
                  </>
                ) : loadingPrices ? (
                  <span className="text-base font-normal opacity-60">載入價格…</span>
                ) : amount ? (
                  <>
                    {amount}
                    <span
                      className={`ml-1 text-sm font-normal ${
                        tier.highlighted ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      {isOneTimeTier(tier) ? "/ 次" : cycle === "month" ? "/ 月" : "/ 年"}
                    </span>
                  </>
                ) : (
                  <span className="text-base font-normal opacity-60">尚未設定價格</span>
                )}
              </p>
              <ul
                className={`mt-6 flex-1 space-y-2 text-sm ${
                  tier.highlighted ? "text-zinc-300" : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {tier.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {isFreeTier(tier) ? (
                <Link
                  href="/"
                  className="mt-8 rounded-lg border border-zinc-300 px-4 py-3 text-center text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  免費開始使用
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={!ready || loadingPrices || !priceId}
                  onClick={() => openCheckout(tier)}
                  className={`mt-8 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-40 ${
                    tier.highlighted
                      ? "bg-white text-zinc-950 hover:bg-zinc-200"
                      : "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
                  }`}
                >
                  {isOneTimeTier(tier) ? "立即解鎖" : "訂閱專業版"}
                </button>
              )}
            </article>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="mt-6 text-center text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
