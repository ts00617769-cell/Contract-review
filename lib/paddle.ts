export const PADDLE_PRICE_ID =
  process.env.NEXT_PUBLIC_PADDLE_PRICE_ID?.trim() ||
  "pri_01m132przkafxjxvmvy5kjrdg3";

export function paddleClientToken(): string | undefined {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim();
  return token || undefined;
}

export function paddleEnvironment(): "sandbox" | "production" {
  return process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox"
    ? "sandbox"
    : "production";
}

export function paddleConfigured(): boolean {
  return Boolean(paddleClientToken());
}
