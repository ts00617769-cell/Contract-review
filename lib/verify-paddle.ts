import { paddleEnvironment } from "@/lib/paddle";
import { allConfiguredPriceIds, planFromPriceId } from "@/lib/pricing-tiers";
import type { PaidPlan } from "@/lib/quota";

const PAID_STATUSES = new Set(["completed", "paid", "billed"]);

type TransactionPayload = {
  data?: {
    status?: string;
    items?: Array<{ price?: { id?: string } }>;
  };
};

export async function verifyPaidTransaction(
  transactionId: string,
): Promise<{ ok: false } | { ok: true; plan: PaidPlan }> {
  if (!/^txn_[a-z0-9]+$/i.test(transactionId)) return { ok: false };

  const apiKey = process.env.PADDLE_API_KEY?.trim();
  if (!apiKey) return { ok: false };

  const host =
    paddleEnvironment() === "sandbox" ? "sandbox-api.paddle.com" : "api.paddle.com";

  const response = await fetch(`https://${host}/transactions/${transactionId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Paddle-Version": "1",
    },
    cache: "no-store",
  });

  if (!response.ok) return { ok: false };

  const payload = (await response.json()) as TransactionPayload;
  const status = payload.data?.status;
  if (!status || !PAID_STATUSES.has(status)) return { ok: false };

  const allowed = new Set(allConfiguredPriceIds());
  const items = payload.data?.items ?? [];
  const matchedId = items
    .map((item) => item.price?.id)
    .find((id): id is string => Boolean(id && (allowed.size === 0 || allowed.has(id))));

  if (items.length > 0 && allowed.size > 0 && !matchedId) return { ok: false };

  const plan = planFromPriceId(matchedId) ?? "onetime";
  return { ok: true, plan };
}
