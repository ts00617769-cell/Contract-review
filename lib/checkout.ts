import type { CheckoutProvider } from "./types";

function readUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function checkoutUrlFor(provider: CheckoutProvider): string | undefined {
  if (provider === "lemonsqueezy") {
    return (
      readUrl(process.env.LEMON_SQUEEZY_CHECKOUT_URL) ||
      readUrl(process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL)
    );
  }
  return (
    readUrl(process.env.STRIPE_CHECKOUT_URL) ||
    readUrl(process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL)
  );
}

export function checkoutAvailability(): Record<CheckoutProvider, boolean> {
  return {
    lemonsqueezy: Boolean(checkoutUrlFor("lemonsqueezy")),
    stripe: Boolean(checkoutUrlFor("stripe")),
  };
}

export function sanitizeCheckoutUrl(raw: string): string {
  const url = new URL(raw);
  if (url.protocol !== "https:") {
    throw new Error("Checkout URL must use HTTPS");
  }
  return url.toString();
}
