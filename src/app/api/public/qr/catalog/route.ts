import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveQrToken } from "@/server/qr/service";
import { getPublicCatalog } from "@/server/qr/checkout";
import { getClientIp, rateLimit, rateLimitResponse } from "@/server/security/rate-limit";

const Schema = z.object({ token: z.string().min(16).max(256) });
export async function POST(request: Request) {
  const ip = getClientIp(request); const rl = rateLimit(`qr:catalog:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);
  const body = await request.json().catch(()=>null); const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Token tidak valid." }, { status: 400 });
  const qr = await resolveQrToken(parsed.data.token);
  if (!qr || !qr.ok) return NextResponse.json({ error: "QR tidak valid." }, { status: 403 });
  try { return NextResponse.json({ ok: true, qr: qr.qr, catalog: await getPublicCatalog() }); }
  catch (e: any) { return NextResponse.json({ error: e?.message || "Gagal memuat katalog." }, { status: e?.status ?? 400 }); }
}
