import { NextResponse } from "next/server";
import { paddleConfigured } from "@/lib/paddle";
import { hasUsedFreeReview, paidAccessPlan, quotaPeriod } from "@/lib/quota";

export async function GET() {
  const paidPlan = await paidAccessPlan();
  const paid = paidPlan !== null;
  const used = paid ? false : await hasUsedFreeReview();
  return NextResponse.json({
    used,
    paid,
    remaining: paid || !used ? 1 : 0,
    limit: paid ? null : 1,
    period: quotaPeriod(),
    plan: paidPlan ?? "free",
    paddle: { configured: paddleConfigured() },
  });
}
