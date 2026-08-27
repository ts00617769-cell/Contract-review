import { cookies } from "next/headers";

export const FREE_REVIEW_COOKIE = "sentry_free_used";

export async function hasUsedFreeReview(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(FREE_REVIEW_COOKIE)?.value === "1";
}

export function freeReviewCookieHeader(): string {
  const maxAge = 60 * 60 * 24 * 365;
  return `${FREE_REVIEW_COOKIE}=1; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`;
}
