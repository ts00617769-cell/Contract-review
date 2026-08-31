import { NextResponse } from "next/server";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { paddleEnvironment } from "@/lib/paddle";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

// Resolve authenticated customer ID securely
async function resolveAuthenticatedCustomerId(): Promise<string | null> {
  // In a production app, verify the user's session securely (e.g. NextAuth session).
  // Do NOT trust a client-supplied ID. We check for a session token cookie.
  // For this MVP, if no proper session verification exists, fail securely.
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("secure_session_id")?.value;

  if (!sessionId) {
    return null;
  }

  // Look up customer based on secure session. This is a stub, assuming the session
  // ID directly relates to a customer or is stored alongside customer metadata.
  // Replace with actual session validation logic.
  const customer = await prisma.customer.findUnique({
    where: { id: sessionId },
  });

  return customer ? customer.id : null;
}

export async function GET() {
  const customerId = await resolveAuthenticatedCustomerId();

  if (!customerId) {
    return NextResponse.json({ error: "Unauthorized or no customer found" }, { status: 401 });
  }

  const apiKey = process.env.PADDLE_API_KEY?.trim() || "";
  if (!apiKey) {
    return NextResponse.json({ error: "Paddle API Key not configured" }, { status: 500 });
  }

  const paddle = new Paddle(apiKey, {
    environment: paddleEnvironment() === "sandbox" ? Environment.sandbox : Environment.production,
  });

  try {
    // Generate a customer portal session for this customer ID
    // Note: this uses the Paddle Node SDK v3
    // Ref: https://developer.paddle.com/api-reference/customer-portal-sessions/create-customer-portal-session
    // Paddle Node SDK 3.x portal sessions: .create(customerId, subscriptionIds)
    const session = await paddle.customerPortalSessions.create(customerId, []);

    if (session && session.urls?.general?.overview) {
      return NextResponse.redirect(session.urls.general.overview);
    } else {
      return NextResponse.json({ error: "Failed to generate portal session URL" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error generating Paddle portal session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
