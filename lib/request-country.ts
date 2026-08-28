const INVALID_COUNTRY = new Set(["", "XX", "T1", "OTHERS", "UNKNOWN"]);

/**
 * ISO 3166-1 alpha-2 from the edge (Vercel sets `x-vercel-ip-country`).
 * Returns undefined when absent or not a real country — never pass sentinels to Paddle.
 */
export function countryFromHeaders(headerStore: Headers): string | undefined {
  const raw = headerStore.get("x-vercel-ip-country")?.trim().toUpperCase();
  if (!raw || INVALID_COUNTRY.has(raw)) return undefined;
  if (!/^[A-Z]{2}$/.test(raw)) return undefined;
  return raw;
}
