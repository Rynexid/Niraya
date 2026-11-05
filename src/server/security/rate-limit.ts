/**
 * Minimal server-side rate limiter.
 * Default: in-memory fixed window (safe fallback for dev/single instance).
 * Redis/Upstash can be plugged in later via RATE_LIMIT_REDIS_URL/UPSTASH_* env
 * without changing callers. Never trust client-side state.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: boolean; remaining: number; resetAt: number };

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + opts.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: opts.limit - 1, resetAt };
  }
  if (existing.count >= opts.limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return { ok: true, remaining: opts.limit - existing.count, resetAt: existing.resetAt };
}

export function getClientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export function rateLimitResponse(resetAt: number) {
  return new Response(JSON.stringify({ error: "Terlalu banyak permintaan. Coba lagi nanti." }), {
    status: 429,
    headers: { "content-type": "application/json", "retry-after": String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))) },
  });
}
