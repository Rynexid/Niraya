import crypto from "crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  DEFAULT_BUSINESS_ID,
  DEFAULT_STORE_ID,
  inventory,
  inventoryReservations,
  orderItems,
  orderStatusHistory,
  orders,
  payments,
  products,
  stockMovements,
  transactionItems,
  transactions,
} from "@/server/db/schema";

function roundMoney(v: number) { return Math.round((v + Number.EPSILON) * 100) / 100; }
function generateTransactionNumber() {
  const d = new Date(); const y = d.getFullYear().toString().slice(-2); const m = String(d.getMonth()+1).padStart(2,"0"); const day = String(d.getDate()).padStart(2,"0");
  return `TRX-${y}${m}${day}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
}

export async function submitPaymentProof(input: { orderId: string; paymentId: string; proofKey: string; referenceNumber?: string | null }) {
  return db.transaction(async (tx: any) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`proof:${input.paymentId}`}))`);
    const [payment] = await tx.select().from(payments).where(and(eq(payments.id, input.paymentId), eq(payments.orderId, input.orderId))).limit(1).for("update");
    if (!payment) throw Object.assign(new Error("Akses tidak valid."), { status: 403 });
    const status = String(payment.status).toUpperCase();
    if (status === "PAID" || payment.status === "completed") throw Object.assign(new Error("Pembayaran sudah diverifikasi."), { status: 409 });
    if (["EXPIRED","REFUNDED","PARTIALLY_REFUNDED"].includes(status)) throw Object.assign(new Error("Pembayaran tidak dapat diperbarui."), { status: 409 });
    const now = new Date();
    await tx.update(payments).set({ proofUrl: input.proofKey, proofSubmittedAt: now, referenceNumber: input.referenceNumber ?? payment.referenceNumber, status: "PENDING" } as any).where(eq(payments.id, payment.id));
    await tx.update(orders).set({ paymentStatus: "PENDING", updatedAt: now }).where(eq(orders.id, input.orderId));
    return { ok: true, paymentId: payment.id, status: "PENDING" };
  });
}

export async function verifyManualPayment(input: { paymentId: string; action: "approve"|"reject"; note?: string; staffUserId: string }) {
  return db.transaction(async (tx: any) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`pay:${input.paymentId}`}))`);
    const [payment] = await tx.select().from(payments).where(eq(payments.id, input.paymentId)).limit(1).for("update");
    if (!payment) throw Object.assign(new Error("Pembayaran tidak ditemukan."), { status: 404 });
    if (!payment.orderId) throw Object.assign(new Error("Pembayaran tidak terkait order QR."), { status: 400 });
    const [order] = await tx.select().from(orders).where(eq(orders.id, payment.orderId)).limit(1).for("update");
    if (!order) throw Object.assign(new Error("Order tidak ditemukan."), { status: 404 });

    const now = new Date();
    const payStatus = String(payment.status).toUpperCase();
    const orderPayStatus = String(order.paymentStatus).toUpperCase();

    if (input.action === "reject") {
      if (payStatus === "PAID" || payment.status === "completed") throw Object.assign(new Error("Pembayaran sudah diverifikasi."), { status: 409 });
      await tx.update(payments).set({ status: "REJECTED", verifiedByUserId: input.staffUserId, verifiedAt: now, verificationNote: input.note || null } as any).where(eq(payments.id, payment.id));
      await tx.update(orders).set({ paymentStatus: "PENDING", updatedAt: now }).where(eq(orders.id, order.id));
      await tx.insert(orderStatusHistory).values({ orderId: order.id, fromOrderStatus: order.orderStatus, toOrderStatus: order.orderStatus, fromPaymentStatus: order.paymentStatus, toPaymentStatus:"PENDING", changedByUserId: input.staffUserId, changedByRole:"staff", reason: input.note||"Payment proof rejected", createdAt: now } as any);
      return { ok: true, status: "REJECTED" };
    }

    // APPROVE
    if (payStatus === "PAID" || payment.status === "completed") {
      // idempotent duplicate approval
      return { ok: true, idempotent: true, status: "PAID", transactionId: payment.transactionId || null };
    }
    if (["EXPIRED","FAILED","REFUNDED","PARTIALLY_REFUNDED"].includes(payStatus)) throw Object.assign(new Error("Pembayaran tidak dapat disetujui."), { status: 409 });
    if (String(order.orderStatus).toUpperCase() === "CANCELLED") throw Object.assign(new Error("Order sudah dibatalkan."), { status: 409 });
    if (orderPayStatus === "EXPIRED") throw Object.assign(new Error("Order sudah kedaluwarsa."), { status: 409 });

    const resRows = await tx.select().from(inventoryReservations).where(eq(inventoryReservations.orderId, order.id)).for("update");
    const reserved = resRows.filter((r: any) => r.status === "RESERVED");
    const allConverted = resRows.length > 0 && resRows.every((r: any) => r.status === "CONVERTED");
    if (reserved.length === 0 && !allConverted && resRows.length > 0) throw Object.assign(new Error("Reservasi tidak valid untuk disetujui."), { status: 409 });
    if (reserved.some((r: any) => r.expiresAt && new Date(r.expiresAt).getTime() <= now.getTime())) {
      throw Object.assign(new Error("Reservasi sudah kedaluwarsa."), { status: 409 });
    }

    // Validate amount/currency
    if (String(payment.currency || "IDR") !== String(order.currency || "IDR")) throw Object.assign(new Error("Currency pembayaran tidak sesuai."), { status: 400 });
    if (roundMoney(Number(payment.amount)) !== roundMoney(Number(order.grandTotal))) throw Object.assign(new Error("Jumlah pembayaran tidak sesuai total order."), { status: 400 });

    // If already has transaction linked (defensive idempotency), do not create duplicates
    if (payment.transactionId) {
      await tx.update(payments).set({ status: "PAID", verifiedByUserId: input.staffUserId, verifiedAt: now, verificationNote: input.note || null, paidAt: now } as any).where(eq(payments.id, payment.id));
      return { ok: true, idempotent: true, status: "PAID", transactionId: payment.transactionId };
    }

    const transactionId = crypto.randomUUID();
    const transactionNumber = generateTransactionNumber();
    const oiRows = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const productIds = [...new Set(oiRows.map((r:any)=>r.productId))];
    const productRows: any[] = productIds.length ? await tx.select().from(products).where(inArray(products.id, productIds as any)) : [];
    const pBy = new Map(productRows.map((r:any)=>[r.id,r]));
    const invRows: any[] = productIds.length ? await tx.select().from(inventory).where(and(eq(inventory.storeId, DEFAULT_STORE_ID), inArray(inventory.productId, productIds as any))).for("update") : [];
    const invBy = new Map(invRows.map((r:any)=>[r.productId,r]));

    // Create legacy financial Transaction snapshot (QR fulfillment accounting)
    await tx.insert(transactions).values({
      id: transactionId,
      businessId: DEFAULT_BUSINESS_ID,
      storeId: DEFAULT_STORE_ID,
      transactionNumber,
      cashierId: null,
      cashierName: "QR Manual Verification",
      customerId: order.customerId ?? null,
      customerName: order.customerName ?? "Guest",
      orderType: order.orderType || "dine-in",
      tableNumber: order.tableNumber ?? null,
      paymentMethod: "manual_transfer",
      paymentStatus: "paid",
      subtotal: String(order.subtotal),
      discountTotal: String(order.discountTotal ?? "0.00"),
      taxTotal: String(order.taxTotal ?? "0.00"),
      grandTotal: String(order.grandTotal),
      amountPaid: String(order.grandTotal),
      changeAmount: "0.00",
      status: "completed",
      createdAt: now,
      updatedAt: now,
    } as any);

    for (const oi of oiRows as any[]) {
      await tx.insert(transactionItems).values({
        id: crypto.randomUUID(),
        transactionId,
        productId: oi.productId,
        productVariantId: oi.productVariantId ?? null,
        productName: oi.productName,
        sku: oi.sku,
        quantity: oi.quantity,
        unitPrice: String(oi.unitPrice),
        discountTotal: String(oi.discountTotal ?? "0.00"),
        taxTotal: String(oi.taxTotal ?? "0.00"),
        lineTotal: String(oi.subtotal ?? oi.unitPrice), // fallback; schema uses subtotal as line snapshot in orders
        costPrice: String(pBy.get(oi.productId)?.costPrice ?? "0.00"),
        notes: oi.notes ?? null,
        createdAt: now,
      } as any);
    }

    // Convert RESERVED reservations once; deduct on-hand once and release reserved.
    for (const r of reserved as any[]) {
      await tx.update(inventoryReservations).set({ status: "CONVERTED", convertedAt: now, updatedAt: now }).where(and(eq(inventoryReservations.id, r.id), eq(inventoryReservations.status, "RESERVED")));
      const inv = invBy.get(r.productId);
      const product = pBy.get(r.productId);
      if (inv) {
        const newReserved = Math.max(0, Number(inv.reservedQuantity || 0) - Number(r.quantity));
        const newStock = Math.max(0, Number(inv.stockQuantity || 0) - Number(r.quantity));
        await tx.update(inventory).set({ reservedQuantity: newReserved, stockQuantity: newStock, updatedAt: now }).where(eq(inventory.id, inv.id));
        inv.reservedQuantity = newReserved; inv.stockQuantity = newStock;
        await tx.insert(stockMovements).values({
          id: crypto.randomUUID(), businessId: DEFAULT_BUSINESS_ID, storeId: DEFAULT_STORE_ID, productId: r.productId,
          productName: product?.name || "Product", movementType: "sale", quantity: -Number(r.quantity), stockAfter: newStock,
          unitCost: product?.costPrice ? String(product.costPrice) : null, note: `QR order ${order.orderNumber} verified`, staffName: "QR Verification",
          referenceType: "qr_order_payment", referenceId: order.id, createdAt: now,
        } as any);
      }
      if (product) {
        await tx.update(products).set({ stockQuantity: sql`greatest(0, ${products.stockQuantity} - ${r.quantity})`, updatedAt: now } as any).where(eq(products.id, r.productId));
      }
    }

    await tx.update(payments).set({ status: "PAID", transactionId, verifiedByUserId: input.staffUserId, verifiedAt: now, verificationNote: input.note || null, paidAt: now } as any).where(eq(payments.id, payment.id));
    await tx.update(orders).set({ paymentStatus: "PAID", paidAt: now, linkedTransactionId: order.linkedTransactionId || transactionId, updatedAt: now }).where(eq(orders.id, order.id));
    await tx.insert(orderStatusHistory).values({ orderId: order.id, fromOrderStatus: order.orderStatus, toOrderStatus: order.orderStatus, fromPaymentStatus: order.paymentStatus, toPaymentStatus:"PAID", changedByUserId: input.staffUserId, changedByRole:"staff", reason: input.note||"Manual transfer verified (QR fulfillment finalized)", createdAt: now } as any);

    return { ok: true, status: "PAID", transactionId, transactionNumber };
  });
}

export async function expireReservations() {
  const now = new Date();
  return db.transaction(async (tx: any) => {
    const rows = await tx.execute(sql`
      SELECT r.* FROM "inventory"."InventoryReservations" r
      WHERE r."Status" = 'RESERVED' AND r."ExpiresAt" IS NOT NULL AND r."ExpiresAt" <= ${now}
      FOR UPDATE SKIP LOCKED LIMIT 200
    `);
    const resRows = (rows as any).rows || rows || [];
    let released = 0;
    for (const r of resRows) {
      const [res] = await tx.select().from(inventoryReservations).where(eq(inventoryReservations.id, r.Id || r.id)).limit(1).for("update");
      if (!res || res.status !== "RESERVED") continue;
      const [order] = await tx.select().from(orders).where(eq(orders.id, res.orderId)).limit(1).for("update");
      if (!order) continue;
      if (String(order.paymentStatus).toUpperCase() === "PAID") continue;
      await tx.update(inventoryReservations).set({ status:"EXPIRED", releasedAt: now, releaseReason:"reservation expired before payment", updatedAt: now }).where(eq(inventoryReservations.id, res.id));
      await tx.update(inventory).set({ reservedQuantity: sql`greatest(0, ${inventory.reservedQuantity} - ${res.quantity})`, updatedAt: now }).where(and(eq(inventory.productId, res.productId), eq(inventory.storeId, res.storeId)));
      released++;
      await tx.update(orders).set({ paymentStatus:"EXPIRED", updatedAt: now }).where(and(eq(orders.id, order.id), sql`${orders.paymentStatus} in ('UNPAID','PENDING')`));
      const [pay] = await tx.select().from(payments).where(eq(payments.orderId, order.id)).limit(1);
      if (pay && !["PAID","completed"].includes(String(pay.status)) && !pay.transactionId) await tx.update(payments).set({ status:"EXPIRED" } as any).where(eq(payments.id, pay.id));
      await tx.insert(orderStatusHistory).values({ orderId: order.id, fromOrderStatus: order.orderStatus, toOrderStatus: order.orderStatus, fromPaymentStatus: order.paymentStatus, toPaymentStatus:"EXPIRED", changedByUserId:null, changedByRole:"system", reason:"Reservation expired", createdAt: now } as any);
    }
    return { released, scanned: resRows.length };
  });
}
