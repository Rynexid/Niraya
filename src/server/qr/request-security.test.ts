import { test, expect } from "bun:test";
import { assertSameOriginIfCookieAuth } from "./request-security";

test("8G.8.3 same-origin: no cookie allows", () => {
  const r = new Request("https://x.test/api", { method: "POST" });
  expect(assertSameOriginIfCookieAuth(r).ok).toBe(true);
});
test("8G.8.3 same-origin: cookie + matching host/origin allows", () => {
  const r = new Request("https://x.test/api", { method: "POST", headers: { cookie: "a=b", origin: "https://app.example.com", host: "app.example.com" } });
  expect(assertSameOriginIfCookieAuth(r).ok).toBe(true);
});
test("8G.8.3 same-origin: cookie + cross-origin rejects", () => {
  const r = new Request("https://x.test/api", { method: "POST", headers: { cookie: "a=b", origin: "https://evil.example", host: "app.example.com" } });
  const res = assertSameOriginIfCookieAuth(r);
  expect(res.ok).toBe(false); if(!res.ok) expect(res.status).toBe(403);
});
test("8G.8.3 same-origin: cookie + missing origin allows (non-browser fallback, documented risk)", () => {
  const r = new Request("https://x.test/api", { method: "POST", headers: { cookie: "a=b", host: "app.example.com" } });
  expect(assertSameOriginIfCookieAuth(r).ok).toBe(true);
});
