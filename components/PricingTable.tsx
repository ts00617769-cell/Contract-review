"use client";

import { initializePaddle, type CountryCode, type Paddle } from "@paddle/paddle-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { readPaddleBrowserConfig } from "@/lib/paddle";
import {
  PRICING_TIERS,
  isPaidTier,
  type BillingCycle,
  type PaidTier,
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
    for (const tier of PRICING_TIERS) {
      if (!isPaidTier(tier)) continue;
      if (tier.priceId.month) ids.add(tier.priceId.month);
      if (tier.priceId.year) ids.add(tier.priceId.year);
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
        void fetch("/api/billing/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionId }),
        }).finally(() => {
          router.push(`/welcome?_ptxn=${encodeURIComponent(transactionId)}`);
        });
      },
    }).then(async (instance) => {
      if (cancelled || !instance) return;
      paddleRef.current = instance;
      setReady(true);

      if (itemsForPreview.length === 0) {
        setLoadingPrices(false);
        setError("尚未設定任何付費 Price ID。請到 Paddle Catalog 建立專業版／大師版價格。");
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

  function openCheckout(tier: PaidTier) {
    setError(null);
    if (!config.ok) {
      setError(config.error);
      return;
    }
    const priceId = tier.priceId[cycle];
    if (!priceId) {
      setError(`${tier.name} 尚未設定${cycle === "month" ? "月繳" : "年繳"} Price ID。`);
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
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg bg-zinc-100 p-1 text-sm dark:bg-zinc-900">
          {(
            [
              ["month", "月繳"],
              ["year", "年繳"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
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
      <p className="mt-3 text-center text-xs text-zinc-400">月繳／年繳只影響專業版與大師版。入門版維持免費。</p>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {PRICING_TIERS.map((tier) => {
          const paid = isPaidTier(tier);
          const priceId = paid ? tier.priceId[cycle] : "";
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
                {tier.highlighted ? (
                  <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
                    建議
                  </span>
                ) : tier.free ? (
                  <span className="rounded-md border border-zinc-200 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:border-zinc-700">
                    免費
                  </span>
                ) : null}
              </div>
              <p
                className={`mt-2 text-sm leading-6 ${
                  tier.highlighted ? "text-zinc-300" : "text-zinc-500"
                }`}
              >
                {tier.description}
              </p>
              <p className="mt-6 text-3xl font-semibold tracking-tight">
                {tier.free ? (
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
                      / {cycle === "month" ? "月" : "年"}
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
              {tier.free ? (
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
                  Subscribe
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
