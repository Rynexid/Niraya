import { NextResponse } from "next/server";
import { requireRole } from "@/server/auth/session";
import { db } from "@/server/db";
import { payments } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { readPaymentProof } from "@/server/storage/payment-proof";

export async function GET(request: Request) {
  try {
    await requireRole("manager");
    const id = new URL(request.url).searchParams.get("paymentId");
    if (!id) return NextResponse.json({ error: "paymentId diperlukan." }, { status: 400 });
    const [p] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    if (!p?.proofUrl) return NextResponse.json({ error: "Bukti tidak ditemukan." }, { status: 404 });
    const file = await readPaymentProof(String(p.proofUrl));
    if (!file) return NextResponse.json({ error: "Bukti tidak ditemukan." }, { status: 404 });
    const body = new Uint8Array(file.bytes);
    return new Response(body, { headers: { "content-type": file.contentType || "application/octet-stream", "cache-control":"private, no-store" } });
  } catch (e:any) { return NextResponse.json({ error: e?.message || "Akses ditolak." }, { status: e?.status ?? 403 }); }
}
