import { cookies } from "next/headers";

export const FREE_REVIEW_COOKIE = "sentry_free_used";
export const PAID_ACCESS_COOKIE = "sentry_pro";

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export async function hasPaidAccess(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(PAID_ACCESS_COOKIE)?.value === "1";
}

export async function hasUsedFreeReview(): Promise<boolean> {
  if (await hasPaidAccess()) return false;
  const jar = await cookies();
  const value = jar.get(FREE_REVIEW_COOKIE)?.value;
  return value === currentPeriod();
}

export function freeReviewCookieHeader(): string {
  const now = new Date();
  const nextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  const maxAge = Math.max(60, Math.floor((nextMonth.getTime() - now.getTime()) / 1000));
  return `${FREE_REVIEW_COOKIE}=${currentPeriod()}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`;
}

export function quotaPeriod(): string {
  return currentPeriod();
}

export function paidAccessCookieHeader(): string {
  const maxAge = 60 * 60 * 24 * 31;
  return `${PAID_ACCESS_COOKIE}=1; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`;
}
