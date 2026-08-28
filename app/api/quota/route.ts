import { NextResponse } from "next/server";
import { paddleConfigured } from "@/lib/paddle";
import { hasPaidAccess, hasUsedFreeReview, quotaPeriod } from "@/lib/quota";

export async function GET() {
  const paid = await hasPaidAccess();
  const used = paid ? false : await hasUsedFreeReview();
  return NextResponse.json({
    used,
    paid,
    remaining: paid || !used ? 1 : 0,
    limit: paid ? null : 1,
    period: quotaPeriod(),
    plan: paid ? "pro" : "free",
    paddle: { configured: paddleConfigured() },
  });
}
