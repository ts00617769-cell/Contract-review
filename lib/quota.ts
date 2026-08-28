import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const FREE_REVIEW_COOKIE = "sentry_free_used";
export const PAID_ACCESS_COOKIE = "sentry_pro";

function accessSecret(): string | null {
  const dedicatedSecret = process.env.ACCESS_TOKEN_SECRET?.trim();
  if (dedicatedSecret) return dedicatedSecret;
  if (process.env.NODE_ENV !== "production") {
    return process.env.PADDLE_API_KEY?.trim() || null;
  }
  return null;
}

function signAccess(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function paidPlanFromToken(value: string | undefined): PaidPlan | null {
  if (!value) return null;
  const secret = accessSecret();
  if (!secret) return null;

  const [plan, expiresAtRaw, signature] = value.split(".");
  if (!["onetime", "month", "year"].includes(plan) || !expiresAtRaw || !signature) {
    return null;
  }
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  const expected = signAccess(`${plan}.${expiresAtRaw}`, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  const valid =
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer);
  return valid ? (plan as PaidPlan) : null;
}

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export async function hasPaidAccess(): Promise<boolean> {
  const jar = await cookies();
  return paidPlanFromToken(jar.get(PAID_ACCESS_COOKIE)?.value) !== null;
}

export async function paidAccessPlan(): Promise<PaidPlan | null> {
  const jar = await cookies();
  return paidPlanFromToken(jar.get(PAID_ACCESS_COOKIE)?.value);
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
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${FREE_REVIEW_COOKIE}=${currentPeriod()}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}

export function quotaPeriod(): string {
  return currentPeriod();
}

export type PaidPlan = "onetime" | "month" | "year";

export function paidAccessDays(plan: PaidPlan): number {
  if (plan === "year") return 366;
  if (plan === "onetime") return 7;
  return 31;
}

export function clearPaidAccessCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${PAID_ACCESS_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
}

export function paidAccessCookieHeader(plan: PaidPlan = "onetime"): string {
  const secret = accessSecret();
  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET 尚未設定。");
  }
  const maxAge = 60 * 60 * 24 * paidAccessDays(plan);
  const expiresAt = Math.floor(Date.now() / 1000) + maxAge;
  const payload = `${plan}.${expiresAt}`;
  const value = `${payload}.${signAccess(payload, secret)}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${PAID_ACCESS_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}
