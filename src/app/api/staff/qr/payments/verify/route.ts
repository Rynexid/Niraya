import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/server/auth/session";
import { getSession } from "@/lib/auth";
import { verifyManualPayment } from "@/server/qr/payments";

const Schema = z.object({ paymentId: z.string().uuid(), action: z.enum(["approve","reject"]), note: z.string().max(500).optional() });
export async function POST(request: Request) {
  try {
    await requireRole("manager");
    const session = await getSession(); const user = (session as any)?.user ?? (session as any)?.data?.user;
    const parsed = Schema.safeParse(await request.json().catch(()=>null));
    if (!parsed.success) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
    return NextResponse.json(await verifyManualPayment({ ...parsed.data, staffUserId: String(user?.id || "unknown") }));
  } catch (e:any) { return NextResponse.json({ error: e?.message || "Gagal." }, { status: e?.status ?? 400 }); }
}
