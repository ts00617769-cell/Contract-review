import { NextResponse } from "next/server";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { PrismaClient } from "@prisma/client";
import { paddleEnvironment } from "@/lib/paddle";

const prisma = new PrismaClient();

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || "";

export async function POST(req: Request) {
  if (!PADDLE_WEBHOOK_SECRET) {
    console.error("PADDLE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
  }

  const apiKey = process.env.PADDLE_API_KEY?.trim() || "DUMMY_KEY";

  const paddle = new Paddle(apiKey, {
    environment: paddleEnvironment() === "sandbox" ? Environment.sandbox : Environment.production,
  });

  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature") || "";

  let eventData;
  try {
    // webhooks.unmarshal could be synchronous or asynchronous depending on the SDK version, adding await handles both in recent versions
    eventData = await paddle.webhooks.unmarshal(rawBody, PADDLE_WEBHOOK_SECRET, signature);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    // If verification fails, don't return a 2xx so Paddle retries
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { eventType, data } = eventData;

  try {
    switch (eventType) {
      case "customer.created":
      case "customer.updated": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customer = data as any;
        await prisma.customer.upsert({
          where: { id: customer.id },
          update: {
            email: customer.email,
          },
          create: {
            id: customer.id,
            email: customer.email,
          },
        });
        break;
      }

      case "subscription.created":
      case "subscription.updated":
      case "subscription.canceled": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = data as any;

        // Items in subscription (we expect at least one to resolve price/product)
        const items = sub.items || [];
        const priceId = items[0]?.price?.id || "unknown";
        const productId = items[0]?.price?.productId || "unknown";

        await prisma.subscription.upsert({
          where: { id: sub.id },
          update: {
            status: sub.status,
            priceId: priceId,
            productId: productId,
            scheduledChangeAction: sub.scheduledChange?.action || null,
            scheduledChangeAt: sub.scheduledChange?.effectiveAt
              ? new Date(sub.scheduledChange.effectiveAt)
              : null,
          },
          create: {
            id: sub.id,
            customerId: sub.customerId,
            status: sub.status,
            priceId: priceId,
            productId: productId,
            scheduledChangeAction: sub.scheduledChange?.action || null,
            scheduledChangeAt: sub.scheduledChange?.effectiveAt
              ? new Date(sub.scheduledChange.effectiveAt)
              : null,
          },
        });
        break;
      }

      case "transaction.completed": {
        // If a transaction completes, we could potentially update customer or sub,
        // but since fulfillment is mostly driven by subscription and customer events,
        // we can safely ignore or log it. The request specifically asks to route it,
        // so we acknowledge it. If the transaction has a customer ID, we could ensure
        // the customer exists (though customer.created usually fires before this).
        break;
      }

      default:
        // Safely ignore other event types
        break;
    }
  } catch (error) {
    console.error("Database operation failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
