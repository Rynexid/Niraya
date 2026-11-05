import { NextResponse } from "next/server";
import { submitPaymentProof } from "@/server/qr/payments";
import { storePaymentProof } from "@/server/storage/payment-proof";
import { getClientIp, rateLimit, rateLimitResponse } from "@/server/security/rate-limit";
import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const ip = getClientIp(request); const rl = rateLimit(`qr:proof:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);
  const form = await request.formData();
  const orderId = String(form.get("orderId")||""); const paymentId = String(form.get("paymentId")||"");
  const referenceNumber = form.get("referenceNumber") ? String(form.get("referenceNumber")) : null;
  const file = form.get("file");
  if (!(file instanceof File) || !orderId || !paymentId) return NextResponse.json({ error: "Data bukti tidak valid." }, { status: 400 });
  const session = await getSession().catch(()=>null); const user = (session as any)?.user ?? (session as any)?.data?.user;
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  if (user?.id && order.customerId && String(order.customerId)!==String(user.id)) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  // Guest proof upload is limited: requires knowing orderId+paymentId; TODO: bind to guest order token/session for stronger control.
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    const stored = await storePaymentProof({ paymentId, contentType: file.type, bytes });
    const res = await submitPaymentProof({ orderId, paymentId, proofKey: stored.key, referenceNumber });
    return NextResponse.json({ ...res, size: stored.size });
  } catch (e:any) { return NextResponse.json({ error: e?.message || "Gagal mengunggah bukti." }, { status: e?.status ?? 400 }); }
}
