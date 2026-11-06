/** Minimal same-origin guard for cookie-authenticated state-changing public requests. */
export function assertSameOriginIfCookieAuth(request: Request): { ok: true } | { ok: false; status: 403; error: string } {
  // If no cookies, CSRF risk via browser cookie auth is minimal; guest token can be sent as Bearer.
  const cookie = request.headers.get("cookie");
  if (!cookie) return { ok: true };
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!origin || !host) {
    // Allow non-browser/CLI clients; browsers usually send Origin on POST.
    return { ok: true };
  }
  try {
    const o = new URL(origin);
    const allowedHosts = (process.env.NEXT_PUBLIC_APP_URL ? [new URL(process.env.NEXT_PUBLIC_APP_URL).host] : []).concat(host.split(",").map(h=>h.trim()));
    if (allowedHosts.includes(o.host)) return { ok: true };
  } catch {}
  return { ok: false, status: 403, error: "Origin tidak diizinkan." };
}
