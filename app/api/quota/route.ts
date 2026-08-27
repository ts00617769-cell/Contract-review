import { NextResponse } from "next/server";
import { hasUsedFreeReview } from "@/lib/quota";

export async function GET() {
  const used = await hasUsedFreeReview();
  return NextResponse.json({ used, remaining: used ? 0 : 1 });
}
