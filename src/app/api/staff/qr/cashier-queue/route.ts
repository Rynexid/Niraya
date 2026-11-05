import { NextResponse } from "next/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { requireRole } from "@/server/auth/session";
import { db } from "@/server/db";
import { orders, orderItems, payments } from "@/server/db/schema";

export async function GET() {
  try {
    await requireRole("cashier");
    const rows = await db.select().from(orders).where(and(
      inArray(orders.orderSource, ["QR_TABLE","QR_GENERAL"]),
      eq(orders.paymentStatus, "PAID"),
      sql`${orders.orderStatus} not in ('COMPLETED','CANCELLED')`,
    )).orderBy(desc(orders.paidAt), desc(orders.createdAt)).limit(100);
    const ids = rows.map(r=>r.id);
    const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
    const pays = ids.length ? await db.select().from(payments).where(inArray(payments.orderId, ids)) : [];
    const byOrder = new Map<string, any[]>(); for(const i of items){const a=byOrder.get(i.orderId)??[];a.push({productName:i.productName,variantName:i.variantName,quantity:i.quantity,notes:i.notes});byOrder.set(i.orderId,a);}
    const payBy = new Map(pays.map(p=>[String(p.orderId),p]));
    return NextResponse.json({ queue: rows.map(r=>({
      orderId:r.id, orderNumber:r.orderNumber, orderSource:r.orderSource, orderStatus:r.orderStatus, paymentStatus:r.paymentStatus,
      tableNumber: r.orderSource==="QR_TABLE" ? r.tableNumber : null, customerName:r.customerName, customerPhone:r.customerPhone,
      items: byOrder.get(r.id)??[], createdAt:r.createdAt, paidAt:r.paidAt, paymentId: payBy.get(r.id)?.id ?? null,
    }))});
  } catch (e:any) { return NextResponse.json({ error: e?.message || "Akses ditolak." }, { status: e?.status ?? 403 }); }
}
