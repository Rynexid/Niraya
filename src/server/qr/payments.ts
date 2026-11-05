import { and, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { DEFAULT_BUSINESS_ID, DEFAULT_STORE_ID, orders, payments, orderStatusHistory, inventoryReservations, inventory, transactions } from "@/server/db/schema";

export async function submitPaymentProof(input: { orderId: string; paymentId: string; proofKey: string; referenceNumber?: string | null; actor?: { id?: string|null; role?: string } }) {
  const now = new Date();
  const [payment] = await db.select().from(payments).where(and(eq(payments.id, input.paymentId), eq(payments.orderId, input.orderId))).limit(1);
  if (!payment) throw Object.assign(new Error("Pembayaran tidak ditemukan."), { status: 404 });
  if (String(payment.status).toUpperCase() === "PAID" || payment.status === "completed") throw Object.assign(new Error("Pembayaran sudah diverifikasi."), { status: 409 });
  await db.update(payments).set({ proofUrl: input.proofKey, proofSubmittedAt: now, referenceNumber: input.referenceNumber ?? payment.referenceNumber, status: "PENDING" } as any).where(eq(payments.id, payment.id));
  await db.update(orders).set({ paymentStatus: "PENDING", updatedAt: now }).where(eq(orders.id, input.orderId));
  return { ok: true, paymentId: payment.id, status: "PENDING" };
}

export async function verifyManualPayment(input: { paymentId: string; action: "approve"|"reject"; note?: string; staffUserId: string }) {
  return db.transaction(async (tx:any) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`pay:${input.paymentId}`}))`);
    const [payment] = await tx.select().from(payments).where(eq(payments.id, input.paymentId)).limit(1).for("update");
    if (!payment) throw Object.assign(new Error("Pembayaran tidak ditemukan."), { status: 404 });
    const [order] = payment.orderId ? await tx.select().from(orders).where(eq(orders.id, payment.orderId)).limit(1).for("update") : [null];
    const now = new Date();
    const statusUpper = String(payment.status).toUpperCase();
    if (input.action === "approve") {
      if (statusUpper === "PAID" || payment.status === "completed") return { ok: true, idempotent: true, status: "PAID" };
      await tx.update(payments).set({ status: "PAID", verifiedByUserId: input.staffUserId, verifiedAt: now, verificationNote: input.note || null, paidAt: now } as any).where(eq(payments.id, payment.id));
      if (order) {
        await tx.update(orders).set({ paymentStatus: "PAID", paidAt: now, updatedAt: now }).where(eq(orders.id, order.id));
        // Convert reservations idempotently.
        const resRows = await tx.select().from(inventoryReservations).where(and(eq(inventoryReservations.orderId, order.id), eq(inventoryReservations.status, "RESERVED"))).for("update");
        for (const r of resRows) {
          await tx.update(inventoryReservations).set({ status:"CONVERTED", convertedAt: now, updatedAt: now }).where(eq(inventoryReservations.id, r.id));
          // Release reserved count; actual stock deduction for QR/manual-verified orders is deferred to fulfillment integration.
          await tx.update(inventory).set({ reservedQuantity: sql`greatest(0, ${inventory.reservedQuantity} - ${r.quantity})`, updatedAt: now }).where(and(eq(inventory.productId, r.productId), eq(inventory.storeId, r.storeId)));
        }
        await tx.insert(orderStatusHistory).values({ orderId: order.id, fromOrderStatus: order.orderStatus, toOrderStatus: order.orderStatus, fromPaymentStatus: order.paymentStatus, toPaymentStatus:"PAID", changedByUserId: input.staffUserId, changedByRole:"staff", reason: input.note||"Manual transfer verified", createdAt: now } as any);
      }
      return { ok: true, status: "PAID" };
    } else {
      await tx.update(payments).set({ status: "REJECTED", verifiedByUserId: input.staffUserId, verifiedAt: now, verificationNote: input.note || null } as any).where(eq(payments.id, payment.id));
      if (order) {
        await tx.update(orders).set({ paymentStatus: "PENDING", updatedAt: now }).where(eq(orders.id, order.id));
        await tx.insert(orderStatusHistory).values({ orderId: order.id, fromOrderStatus: order.orderStatus, toOrderStatus: order.orderStatus, fromPaymentStatus: order.paymentStatus, toPaymentStatus:"PENDING", changedByUserId: input.staffUserId, changedByRole:"staff", reason: input.note||"Payment proof rejected", createdAt: now } as any);
      }
      return { ok: true, status: "REJECTED" };
    }
  });
}

export async function expireReservations() {
  const now = new Date();
  return db.transaction(async (tx:any) => {
    // Lock candidate reservations to avoid double processing.
    const rows = await tx.select().from(inventoryReservations).where(and(eq(inventoryReservations.status,"RESERVED"), sql`${inventoryReservations.expiresAt} is not null and ${inventoryReservations.expiresAt} <= ${now}`)).limit(200).for("update", { skipLocked: true } as any);
    let released = 0;
    for (const r of rows) {
      const [order] = await tx.select().from(orders).where(eq(orders.id, r.orderId)).limit(1).for("update");
      if (!order) continue;
      const paid = String(order.paymentStatus).toUpperCase() === "PAID";
      if (paid) continue; // never expire paid order reservation; conversion handled by verification
      await tx.update(inventoryReservations).set({ status:"EXPIRED", releasedAt: now, releaseReason:"reservation expired before payment", updatedAt: now }).where(eq(inventoryReservations.id, r.id));
      await tx.update(inventory).set({ reservedQuantity: sql`greatest(0, ${inventory.reservedQuantity} - ${r.quantity})`, updatedAt: now }).where(and(eq(inventory.productId, r.productId), eq(inventory.storeId, r.storeId)));
      released++;
      await tx.update(orders).set({ paymentStatus:"EXPIRED", updatedAt: now }).where(and(eq(orders.id, order.id), sql`${orders.paymentStatus} in ('UNPAID','PENDING')`));
      const [pay] = await tx.select().from(payments).where(eq(payments.orderId, order.id)).limit(1);
      if (pay && !["PAID","completed"].includes(String(pay.status))) await tx.update(payments).set({ status:"EXPIRED" } as any).where(eq(payments.id, pay.id));
      await tx.insert(orderStatusHistory).values({ orderId: order.id, fromOrderStatus: order.orderStatus, toOrderStatus: order.orderStatus, fromPaymentStatus: order.paymentStatus, toPaymentStatus:"EXPIRED", changedByUserId:null, changedByRole:"system", reason:"Reservation expired", createdAt: now } as any);
    }
    return { released, scanned: rows.length };
  });
}
