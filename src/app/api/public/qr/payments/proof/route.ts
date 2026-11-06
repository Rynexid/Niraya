import { NextResponse } from "next/server";
import { submitPaymentProof } from "@/server/qr/payments";
import { storePaymentProof } from "@/server/storage/payment-proof";
import { getClientIp, rateLimit, rateLimitResponse } from "@/server/security/rate-limit";
import { db } from "@/server/db";
import { orders, payments } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getGuestTokenFromRequest, resolveGuestAccess } from "@/server/qr/guest-access";
import { assertSameOriginIfCookieAuth } from "@/server/qr/request-security";

export async function POST(request: Request) {
  const origin = assertSameOriginIfCookieAuth(request);
  if (!origin.ok) return NextResponse.json({ error: origin.error }, { status: origin.status });
  const ip = getClientIp(request); const rl = rateLimit(`qr:proof:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);
  const form = await request.formData();
  const orderId = String(form.get("orderId")||""); const paymentId = String(form.get("paymentId")||"");
  const referenceNumber = form.get("referenceNumber") ? String(form.get("referenceNumber")) : null;
  const file = form.get("file");
  if (!(file instanceof File) || !orderId || !paymentId) return NextResponse.json({ error: "Data bukti tidak valid." }, { status: 400 });
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const [payment] = await db.select().from(payments).where(and(eq(payments.id, paymentId), eq(payments.orderId, orderId))).limit(1);
  if (!order || !payment) return NextResponse.json({ error: "Akses tidak valid." }, { status: 403 });
  const session = await getSession().catch(()=>null); const user = (session as any)?.user ?? (session as any)?.data?.user;
  let authorized = false;
  if (user?.id && order.customerId && String(order.customerId)===String(user.id)) authorized = true;
  if (!authorized && !order.customerId) {
    const access = await resolveGuestAccess(orderId, getGuestTokenFromRequest(request, orderId));
    if (access) authorized = true;
  }
  if (!authorized) return NextResponse.json({ error: "Akses tidak valid." }, { status: 403 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    const stored = await storePaymentProof({ paymentId, contentType: file.type, bytes });
    const res = await submitPaymentProof({ orderId, paymentId, proofKey: stored.key, referenceNumber });
    return NextResponse.json({ ...res, size: stored.size });
  } catch (e:any) { return NextResponse.json({ error: e?.message || "Gagal mengunggah bukti." }, { status: e?.status ?? 400 }); }
}
