const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Small in-process fixed-window limiter. Suitable for a single Vercel region
 * and as a defence-in-depth measure; swap for Upstash/Redis in production.
 */
export function rateLimit(key: string, limit = 5, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, retryAfterSeconds: 0 };
}

export function clientKey(headers: Headers | Record<string, string | undefined>, prefix: string) {
  const get = (name: string) =>
    headers instanceof Headers ? headers.get(name) : headers[name.toLowerCase()];
  const ip = get("x-forwarded-for")?.split(",")[0]?.trim() || get("x-real-ip") || "local";
  return `${prefix}:${ip}`;
}
