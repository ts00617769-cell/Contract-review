"use client";

import { initializePaddle, type CountryCode, type Paddle } from "@paddle/paddle-js";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { readPaddleBrowserConfig } from "@/lib/paddle";
import { PRICING_TIERS, type BillingCycle, type Tier } from "@/lib/pricing-tiers";

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
        setError("尚未設定任何 Paddle Price ID。請到 lib/pricing-tiers.ts 或環境變數貼上 pri_ 編號。");
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

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {PRICING_TIERS.map((tier) => {
          const priceId = tier.priceId[cycle];
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
                {loadingPrices ? (
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
