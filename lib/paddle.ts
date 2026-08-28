export type PaddleEnv = "sandbox" | "production";

export function paddleEnvironment(): PaddleEnv {
  const raw = process.env.NEXT_PUBLIC_PADDLE_ENV?.trim();
  if (raw === "sandbox" || raw === "production") return raw;
  throw new Error(
    "NEXT_PUBLIC_PADDLE_ENV 未設定或無效。請設為 sandbox 或 production，不要留空。",
  );
}

export function paddleClientToken(): string {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN 未設定。請貼上 Paddle Client-side Token。",
    );
  }
  return token;
}

export function assertTokenMatchesEnvironment(token: string, env: PaddleEnv): void {
  if (env === "production" && !token.startsWith("live_")) {
    throw new Error("Live 環境必須使用 live_ 開頭的 Client-side Token。");
  }
  if (env === "sandbox" && !token.startsWith("test_")) {
    throw new Error("Sandbox 環境必須使用 test_ 開頭的 Client-side Token。");
  }
}

export function readPaddleBrowserConfig():
  | { ok: true; token: string; environment: PaddleEnv }
  | { ok: false; error: string } {
  try {
    const environment = paddleEnvironment();
    const token = paddleClientToken();
    assertTokenMatchesEnvironment(token, environment);
    return { ok: true, token, environment };
  } catch (caught) {
    return {
      ok: false,
      error: caught instanceof Error ? caught.message : "Paddle 設定不完整。",
    };
  }
}

export function paddleConfigured(): boolean {
  return readPaddleBrowserConfig().ok && Boolean(process.env.PADDLE_API_KEY?.trim());
}

/** @deprecated Prefer PRICING_TIERS. Kept so older unlock paths still compile. */
export const PADDLE_PRICE_ID =
  process.env.NEXT_PUBLIC_PADDLE_PRICE_ONETIME?.trim() ||
  process.env.NEXT_PUBLIC_PADDLE_PRICE_ID?.trim() ||
  "pri_01m132przkafxjxvmvy5kjrdg3";
