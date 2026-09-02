"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { readPaddleBrowserConfig } from "@/lib/paddle";
import {
  monthPriceId,
  oneTimePriceId,
  yearPriceId,
} from "@/lib/pricing-tiers";

type UpgradeGateProps = {
  onUnlocked?: () => void;
};

type PaidOffer = {
  key: "onetime" | "month" | "year";
  name: string;
  blurb: string;
  features: string[];
  priceId: string;
  suffix: string;
  highlighted?: boolean;
};

export function UpgradeGate({ onUnlocked }: UpgradeGateProps) {
  const paddleRef = useRef<Paddle | null>(null);
  const onUnlockedRef = useRef(onUnlocked);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const config = useMemo(() => readPaddleBrowserConfig(), []);

  const offers = useMemo<PaidOffer[]>(
    () =>
      [
        {
          key: "onetime" as const,
          name: "單次解鎖",
          blurb: "一次付清，只開這一份完整報告。",
          features: ["完整風險報告與修約信", "不自動續訂", "下一份需再買"],
          priceId: oneTimePriceId(),
          suffix: "/ 次",
        },
        {
          key: "month" as const,
          name: "專業版月繳",
          blurb: "同一裝置約 31 天不限份數。",
          features: ["完整報告不限份數", "約 31 天有效", "由 Paddle 自動續訂"],
          priceId: monthPriceId(),
          suffix: "/ 月",
        },
        {
          key: "year" as const,
          name: "專業版年繳",
          blurb: "同一裝置約 366 天不限份數。",
          features: ["完整報告不限份數", "約 366 天有效", "由 Paddle 自動續訂"],
          priceId: yearPriceId(),
          suffix: "/ 年",
          highlighted: true,
        },
      ].filter((offer) => offer.priceId),
    [],
  );

  useEffect(() => {
    onUnlockedRef.current = onUnlocked;
  }, [onUnlocked]);

  useEffect(() => {
    if (!config.ok) {
      setLoadingPrices(false);
      return;
    }
    let cancelled = false;

    async function confirmPayment(transactionId: string) {
      setLoading(true);
      setError(null);
      try {
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const response = await fetch("/api/billing/unlock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactionId }),
          });
          const data = (await response.json()) as { error?: string };
          if (response.ok) {
            onUnlockedRef.current?.();
            return;
          }
          if (response.status !== 409 || attempt === 5) {
            throw new Error(data.error || "付款已收到，但解鎖失敗。請保留 Paddle 收據。");
          }
          await new Promise((resolve) => window.setTimeout(resolve, 1500));
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "解鎖失敗。");
      } finally {
        setLoading(false);
      }
    }

    void initializePaddle({
      token: config.token,
      environment: config.environment,
      eventCallback: (event) => {
        if (event.name !== "checkout.completed") return;
        const transactionId = event.data?.transaction_id;
        if (typeof transactionId !== "string") return;
        void confirmPayment(transactionId);
      },
    }).then(async (instance) => {
      if (cancelled || !instance) return;
      paddleRef.current = instance;
      setReady(true);

      const items = offers.map((offer) => ({
        priceId: offer.priceId,
        quantity: 1,
      }));
      if (items.length === 0) {
        setLoadingPrices(false);
        setError("尚未設定任何付費 Price ID。");
        return;
      }

      try {
        const preview = await instance.PricePreview({ items });
        const next: Record<string, string> = {};
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
  }, [config, offers]);

  function openCheckout(priceId: string) {
    setError(null);
    if (!config.ok) {
      setError(config.error);
      return;
    }
    const paddle = paddleRef.current;
    if (!paddle) {
      setError("結帳元件還在載入，請稍候再點一次。");
      return;
    }
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      settings: {
        displayMode: "overlay",
        variant: "one-page",
        successUrl: `${window.location.origin}/welcome`,
      },
    });
  }

  return (
    <section
      aria-labelledby="upgrade-title"
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          完整報告已鎖定
        </p>
        <h2
          id="upgrade-title"
          className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white"
        >
          解鎖完整拆解與修約信
        </h2>
        <p className="mt-3 text-sm leading-7 text-zinc-500">
          單次解鎖只開這一份。月繳、年繳在有效期間內可不限份數查看。價格以結帳頁為準。
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-3">
        {offers.map((offer) => {
          const amount = prices[offer.priceId];
          return (
            <article
              key={offer.key}
              className={`flex flex-col rounded-xl border p-5 ${
                offer.highlighted
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-700"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <p className="text-sm font-semibold">{offer.name}</p>
              <p
                className={`mt-2 text-sm leading-6 ${
                  offer.highlighted ? "text-zinc-300" : "text-zinc-500"
                }`}
              >
                {offer.blurb}
              </p>
              <p className="mt-4 text-2xl font-semibold">
                {loadingPrices ? (
                  <span className="text-base font-normal opacity-60">載入價格…</span>
                ) : amount ? (
                  <>
                    {amount}
                    <span
                      className={`ml-1 text-sm font-normal ${
                        offer.highlighted ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      {offer.suffix}
                    </span>
                  </>
                ) : (
                  <span className="text-base font-normal opacity-60">尚未設定</span>
                )}
              </p>
              <ul
                className={`mt-4 flex-1 space-y-2 text-sm ${
                  offer.highlighted ? "text-zinc-300" : "text-zinc-500"
                }`}
              >
                {offer.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button
                type="button"
                disabled={loading || !ready || !offer.priceId}
                onClick={() => openCheckout(offer.priceId)}
                className={`mt-6 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-40 ${
                  offer.highlighted
                    ? "bg-white text-zinc-950 hover:bg-zinc-200"
                    : "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
                }`}
              >
                {loading
                  ? "確認付款中…"
                  : offer.key === "onetime"
                    ? "解鎖這份報告"
                    : offer.key === "month"
                      ? "訂閱月繳"
                      : "訂閱年繳"}
              </button>
            </article>
          );
        })}
      </div>

      <p className="mt-6 text-center">
        <Link
          href="/pricing"
          className="text-sm font-medium text-zinc-500 underline-offset-4 hover:text-zinc-950 hover:underline dark:hover:text-white"
        >
          查看完整方案說明
        </Link>
      </p>
      {error ? (
        <p role="alert" className="mt-4 text-center text-sm text-red-600">
          {error}
        </p>
      ) : !config.ok ? (
        <p role="alert" className="mt-4 text-center text-sm text-red-600">
          {config.error}
        </p>
      ) : null}
    </section>
  );
}
