import { paddleEnvironment } from "@/lib/paddle";
import { allConfiguredPriceIds } from "@/lib/pricing-tiers";

const PAID_STATUSES = new Set(["completed", "paid", "billed"]);

type TransactionPayload = {
  data?: {
    status?: string;
    items?: Array<{ price?: { id?: string } }>;
  };
};

export async function verifyPaidTransaction(transactionId: string): Promise<boolean> {
  if (!/^txn_[a-z0-9]+$/i.test(transactionId)) return false;

  const apiKey = process.env.PADDLE_API_KEY?.trim();
  if (!apiKey) return false;

  const host =
    paddleEnvironment() === "sandbox" ? "sandbox-api.paddle.com" : "api.paddle.com";

  const response = await fetch(`https://${host}/transactions/${transactionId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Paddle-Version": "1",
    },
    cache: "no-store",
  });

  if (!response.ok) return false;

  const payload = (await response.json()) as TransactionPayload;
  const status = payload.data?.status;
  if (!status || !PAID_STATUSES.has(status)) return false;

  const allowed = new Set(allConfiguredPriceIds());
  const items = payload.data?.items ?? [];
  if (items.length === 0) return true;
  if (allowed.size === 0) return true;
  return items.some((item) => item.price?.id && allowed.has(item.price.id));
}
