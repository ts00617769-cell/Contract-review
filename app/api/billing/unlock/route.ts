import { NextResponse } from "next/server";
import { paidAccessCookieHeader } from "@/lib/quota";
import { verifyPaidTransaction } from "@/lib/verify-paddle";

export async function POST(request: Request) {
  let body: { transactionId?: unknown };
  try {
    body = (await request.json()) as { transactionId?: unknown };
  } catch {
    return NextResponse.json({ error: "無效的解鎖請求。" }, { status: 400 });
  }

  if (typeof body.transactionId !== "string" || !body.transactionId.trim()) {
    return NextResponse.json({ error: "缺少交易編號。" }, { status: 400 });
  }

  let ok = false;
  try {
    ok = await verifyPaidTransaction(body.transactionId.trim());
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : "Paddle 環境變數不完整。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  if (!ok) {
    return NextResponse.json(
      { error: "付款尚未確認。請確認已在 Vercel 設定 PADDLE_API_KEY。" },
      { status: 402 },
    );
  }

  const response = NextResponse.json({ paid: true });
  response.headers.append("Set-Cookie", paidAccessCookieHeader());
  return response;
}
