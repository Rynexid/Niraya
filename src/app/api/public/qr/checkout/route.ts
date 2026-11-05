import { NextResponse } from "next/server";
import { z } from "zod";
import { executeQrCheckout } from "@/server/qr/checkout";
import { getClientIp, rateLimit, rateLimitResponse } from "@/server/security/rate-limit";
import { getSession } from "@/lib/auth";

const Schema = z.object({
  qrToken: z.string().min(16).max(256),
  idempotencyKey: z.string().min(8).max(128),
  items: z.array(z.object({ productId: z.string().min(1), variantId: z.string().uuid().nullish(), quantity: z.number().int().positive().max(99), notes: z.string().max(200).optional() })).min(1).max(50),
  paymentMethod: z.literal("manual_transfer"),
  orderType: z.enum(["dine-in","takeaway"]).optional(),
  notes: z.string().max(500).optional(),
  guest: z.object({ name: z.string().min(2).max(100), phone: z.string().min(6).max(30), email: z.string().email().nullish() }).optional(),
  asAuthenticated: z.boolean().optional(),
});
export async function POST(request: Request) {
  const ip = getClientIp(request); const rl = rateLimit(`qr:checkout:${ip}`, { limit: 15, windowMs: 60_000 });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);
  const body = await request.json().catch(()=>null); const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Data checkout tidak valid.", details: parsed.error.flatten() }, { status: 400 });
  const session = await getSession().catch(()=>null);
  const user = (session as any)?.user ?? (session as any)?.data?.user ?? null;
  const useAuth = !!parsed.data.asAuthenticated && !!user?.id;
  if (parsed.data.asAuthenticated && !user?.id) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  const customer = useAuth
    ? { mode: "authenticated" as const, name: String(user.name || "Customer"), phone: String((user as any).phone || parsed.data.guest?.phone || ""), email: (user.email ?? null) as string|null, customerId: String(user.id) }
    : { mode: "guest" as const, name: parsed.data.guest?.name || "", phone: parsed.data.guest?.phone || "", email: (parsed.data.guest?.email ?? null) as string|null };
  try {
    const result = await executeQrCheckout({ ...parsed.data, items: parsed.data.items.map(i=>({...i, notes: i.notes ?? undefined})), customer });
    return NextResponse.json(result);
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Checkout gagal." }, { status: e?.status ?? 400 }); }
}
