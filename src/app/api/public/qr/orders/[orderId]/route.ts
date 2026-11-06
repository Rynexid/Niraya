import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { orders, orderItems, payments } from "@/server/db/schema";
import { getSession } from "@/lib/auth";
import { getGuestTokenFromRequest, resolveGuestAccess } from "@/server/qr/guest-access";
import { getClientIp, rateLimit, rateLimitResponse } from "@/server/security/rate-limit";

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const ip = getClientIp(request); const rl = rateLimit(`qr:order:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);
  const { orderId } = await params;
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return NextResponse.json({ error: "Akses tidak valid." }, { status: 403 });
  const session = await getSession().catch(()=>null); const user = (session as any)?.user ?? (session as any)?.data?.user;
  let authorized = false;
  if (user?.id && order.customerId && String(order.customerId) === String(user.id)) authorized = true;
  if (!authorized && !order.customerId) {
    const token = getGuestTokenFromRequest(request, orderId);
    const access = await resolveGuestAccess(orderId, token);
    if (access) authorized = true;
  }
  if (!authorized) return NextResponse.json({ error: "Akses tidak valid." }, { status: 403 });
  const items = await db.select({ productName: orderItems.productName, variantName: orderItems.variantName, quantity: orderItems.quantity, unitPrice: orderItems.unitPrice, subtotal: orderItems.subtotal }).from(orderItems).where(eq(orderItems.orderId, orderId));
  const [pay] = await db.select({ id: payments.id, status: payments.status, method: payments.paymentMethod, amount: payments.amount, proofSubmittedAt: payments.proofSubmittedAt }).from(payments).where(eq(payments.orderId, orderId)).limit(1);
  return NextResponse.json({ order: {
    id: order.id, orderNumber: order.orderNumber, orderSource: order.orderSource, orderStatus: order.orderStatus, paymentStatus: order.paymentStatus,
    customerName: order.customerName, tableNumber: order.orderSource==="QR_TABLE"?order.tableNumber:null, totals: { subtotal: Number(order.subtotal), tax: Number(order.taxTotal), total: Number(order.grandTotal), currency: order.currency },
    items: items.map(i=>({...i, unitPrice:Number(i.unitPrice), subtotal:Number(i.subtotal)})), payment: pay ? { id: pay.id, status: pay.status, method: pay.method, amount: Number(pay.amount), proofSubmitted: !!pay.proofSubmittedAt } : null,
    createdAt: order.createdAt, submittedAt: order.submittedAt, paidAt: order.paidAt,
  }});
}
