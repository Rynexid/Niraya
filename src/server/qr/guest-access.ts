import crypto from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { guestOrderAccess } from "@/server/db/schema";

const TOKEN_BYTES = 32; // 256 bits

export function generateGuestAccessToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}
export function hashGuestToken(raw: string): string {
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}
export function verifyGuestToken(raw: string, expectedHash: string): boolean {
  const a = Buffer.from(hashGuestToken(raw), "hex");
  const b = Buffer.from(expectedHash, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function createGuestOrderAccess(orderId: string, ttlMinutes = 60 * 24 * 3) {
  const raw = generateGuestAccessToken();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60000);
  await db.insert(guestOrderAccess).values({ orderId, tokenHash: hashGuestToken(raw), expiresAt } as any);
  return { rawToken: raw, expiresAt };
}

export async function createGuestAccessInTx(tx: any, orderId: string, ttlMinutes = 60 * 24 * 3) {
  const raw = generateGuestAccessToken();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60000);
  await tx.insert(guestOrderAccess).values({ orderId, tokenHash: hashGuestToken(raw), expiresAt } as any);
  return { rawToken: raw, expiresAt };
}

export async function resolveGuestAccess(orderId: string, rawToken: string | null | undefined) {
  if (!rawToken) return null;
  const hash = hashGuestToken(rawToken);
  const [row] = await db.select().from(guestOrderAccess).where(and(
    eq(guestOrderAccess.orderId, orderId),
    eq(guestOrderAccess.tokenHash, hash),
    isNull(guestOrderAccess.revokedAt),
  )).limit(1);
  if (!row) return null;
  if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) return null;
  await db.update(guestOrderAccess).set({ lastUsedAt: new Date() } as any).where(eq(guestOrderAccess.id, row.id));
  return row;
}

export async function revokeGuestAccessByToken(orderId: string, rawToken: string) {
  const hash = hashGuestToken(rawToken);
  await db.update(guestOrderAccess).set({ revokedAt: new Date() } as any).where(and(eq(guestOrderAccess.orderId, orderId), eq(guestOrderAccess.tokenHash, hash), isNull(guestOrderAccess.revokedAt)));
}

export function guestCookieName(orderId: string) {
  const short = crypto.createHash("sha256").update(orderId).digest("base64url").slice(0, 16);
  return `niraya_goat_${short}`;
}

export function getGuestTokenFromRequest(request: Request, orderId: string): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim() || null;
  const cookie = request.headers.get("cookie") || "";
  const name = guestCookieName(orderId);
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("=")) || null;
  }
  return null;
}

export function guestCookieHeader(orderId: string, rawToken: string, expiresAt: Date) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${guestCookieName(orderId)}=${encodeURIComponent(rawToken)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${secure}`;
}
