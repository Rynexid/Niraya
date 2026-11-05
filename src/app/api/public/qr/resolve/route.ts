import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveQrToken } from "@/server/qr/service";
import { getClientIp, rateLimit, rateLimitResponse } from "@/server/security/rate-limit";

const Schema = z.object({ token: z.string().min(16).max(256) });
export async function POST(request: Request) {
  const ip = getClientIp(request); const rl = rateLimit(`qr:resolve:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);
  const body = await request.json().catch(()=>null); const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Token tidak valid." }, { status: 400 });
  const result = await resolveQrToken(parsed.data.token);
  if (!result) return NextResponse.json({ error: "QR tidak ditemukan." }, { status: 404 });
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 403 });
  return NextResponse.json({ ok: true, qr: result.qr });
}
