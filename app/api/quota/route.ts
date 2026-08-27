import { NextResponse } from "next/server";
import {
  checkoutAvailability,
  checkoutUrlFor,
  sanitizeCheckoutUrl,
} from "@/lib/checkout";
import { hasUsedFreeReview, quotaPeriod } from "@/lib/quota";

export async function GET() {
  const used = await hasUsedFreeReview();
  return NextResponse.json({
    used,
    remaining: used ? 0 : 1,
    limit: 1,
    period: quotaPeriod(),
    plan: "free",
    checkoutProviders: checkoutAvailability(),
  });
}

export async function POST(request: Request) {
  let body: { provider?: unknown };
  try {
    body = (await request.json()) as { provider?: unknown };
  } catch {
    return NextResponse.json({ error: "無效的結帳請求。" }, { status: 400 });
  }

  const available = checkoutAvailability();
  const provider =
    body.provider === "stripe" || body.provider === "lemonsqueezy"
      ? body.provider
      : available.lemonsqueezy
        ? "lemonsqueezy"
        : available.stripe
          ? "stripe"
          : null;

  if (!provider) {
    return NextResponse.json(
      {
        error:
          "尚未設定結帳連結。請在 Vercel 環境變數填入 LEMON_SQUEEZY_CHECKOUT_URL。",
      },
      { status: 503 },
    );
  }

  const checkoutUrl = checkoutUrlFor(provider);
  if (!checkoutUrl) {
    return NextResponse.json(
      { error: "結帳功能尚未設定，請在 Vercel 加入 LEMON_SQUEEZY_CHECKOUT_URL。" },
      { status: 503 },
    );
  }

  try {
    return NextResponse.json({
      checkoutUrl: sanitizeCheckoutUrl(checkoutUrl),
      provider,
    });
  } catch {
    return NextResponse.json(
      { error: "結帳連結設定錯誤，請確認使用 https Checkout URL。" },
      { status: 500 },
    );
  }
}
