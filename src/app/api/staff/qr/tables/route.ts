import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/server/auth/session";
import { createTableQr, ensureGeneralQr, listDiningTables, regenerateQrToken, updateDiningTable } from "@/server/qr/service";

export async function GET() {
  try { await requireRole("manager"); return NextResponse.json({ tables: await listDiningTables() }); }
  catch (e:any) { return NextResponse.json({ error: e?.message || "Akses ditolak." }, { status: e?.status ?? 403 }); }
}
const Post = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_table"), tableNumber: z.string().max(50).optional(), name: z.string().max(100).optional() }),
  z.object({ action: z.literal("ensure_general") }),
  z.object({ action: z.literal("regenerate"), id: z.string().uuid() }),
  z.object({ action: z.literal("update"), id: z.string().uuid(), tableNumber: z.string().max(50).nullable().optional(), name: z.string().max(100).nullable().optional(), isActive: z.boolean().optional() }),
]);
export async function POST(request: Request) {
  try {
    await requireRole("manager");
    const parsed = Post.safeParse(await request.json().catch(()=>null));
    if (!parsed.success) return NextResponse.json({ error: "Data tidak valid.", details: parsed.error.flatten() }, { status: 400 });
    const b = parsed.data;
    if (b.action==="create_table") return NextResponse.json(await createTableQr(b));
    if (b.action==="ensure_general") return NextResponse.json(await ensureGeneralQr());
    if (b.action==="regenerate") { const r=await regenerateQrToken(b.id); if(!r) return NextResponse.json({error:"Meja/QR tidak ditemukan."},{status:404}); return NextResponse.json(r); }
    const r = await updateDiningTable(b.id, { tableNumber: b.tableNumber, name: b.name, isActive: b.isActive });
    if (!r) return NextResponse.json({ error: "Meja/QR tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ row: r });
  } catch (e:any) { return NextResponse.json({ error: e?.message || "Gagal." }, { status: e?.status ?? 400 }); }
}
