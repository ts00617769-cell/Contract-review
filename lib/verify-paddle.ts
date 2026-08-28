import {
  assertApiKeyMatchesEnvironment,
  paddleEnvironment,
} from "@/lib/paddle";
import { allConfiguredPriceIds, planFromPriceId } from "@/lib/pricing-tiers";
import type { PaidPlan } from "@/lib/quota";

type TransactionPayload = {
  data?: {
    status?: string;
    items?: Array<{ price?: { id?: string } }>;
  };
};

export async function verifyPaidTransaction(
  transactionId: string,
): Promise<{ ok: false } | { ok: true; plan: PaidPlan }> {
  if (!/^txn_[a-z0-9]{26}$/.test(transactionId)) return { ok: false };

  const apiKey = process.env.PADDLE_API_KEY?.trim();
  if (!apiKey) throw new Error("PADDLE_API_KEY 尚未設定。");

  const environment = paddleEnvironment();
  assertApiKeyMatchesEnvironment(apiKey, environment);
  const host = environment === "sandbox" ? "sandbox-api.paddle.com" : "api.paddle.com";

  const response = await fetch(`https://${host}/transactions/${transactionId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Paddle-Version": "1",
    },
    cache: "no-store",
  });

  if (response.status === 404) return { ok: false };
  if (!response.ok) {
    throw new Error(`Paddle 交易查詢失敗（${response.status}）。`);
  }

  const payload = (await response.json()) as TransactionPayload;
  const status = payload.data?.status;
  if (status !== "completed") return { ok: false };

  const allowed = new Set(allConfiguredPriceIds());
  if (allowed.size === 0) throw new Error("尚未設定任何 Paddle Price ID。");
  const items = payload.data?.items ?? [];
  const matchedId = items
    .map((item) => item.price?.id)
    .find((id): id is string => Boolean(id && allowed.has(id)));

  if (!matchedId) return { ok: false };

  const plan = planFromPriceId(matchedId);
  if (!plan) return { ok: false };
  return { ok: true, plan };
}
