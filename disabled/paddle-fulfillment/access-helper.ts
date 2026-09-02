import { PrismaClient, Subscription } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Helper function that decides whether a subscription currently grants paid access.
 * Treat `active` AND `trialing` as access-granting.
 * Do NOT revoke access just because a `scheduled_change` to cancel or pause exists.
 * Revoke only when `status` is actually `canceled`.
 */
export function subscriptionGrantsAccess(subscription: Subscription): boolean {
  if (!subscription) return false;
  return subscription.status === "active" || subscription.status === "trialing";
}

/**
 * Determine if a specific customer currently has paid access.
 */
export async function customerHasPaidAccess(customerId: string): Promise<boolean> {
  const subscriptions = await prisma.subscription.findMany({
    where: { customerId },
  });

  return subscriptions.some(subscriptionGrantsAccess);
}
