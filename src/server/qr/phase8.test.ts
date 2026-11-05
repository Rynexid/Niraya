import { test, expect } from "bun:test";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { DEFAULT_BUSINESS_ID, DEFAULT_STORE_ID, products, inventory, categories, diningTables, orders, orderItems, payments, inventoryReservations, checkoutIdempotency, businessSettings } from "@/server/db/schema";
import { generateQrToken, hashQrToken } from "@/server/qr/token";
import { executeQrCheckout } from "@/server/qr/checkout";
import { verifyManualPayment, expireReservations } from "@/server/qr/payments";

const uid = (p:string)=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

test("phase8 qr token: raw token not stored, hash unique check works", async () => {
  const raw = generateQrToken(); const hash = hashQrToken(raw);
  expect(raw.length).toBeGreaterThan(30); expect(hash).toMatch(/^[a-f0-9]{64}$/);
  const [row] = await db.insert(diningTables).values({ businessId: DEFAULT_BUSINESS_ID, storeId: DEFAULT_STORE_ID, name: "T1", tableNumber: uid("T"), qrType:"TABLE", qrTokenHash: hash, isActive: true }).returning();
  expect(row.qrTokenHash).toBe(hash); expect((row as any).rawToken).toBeUndefined();
  await db.update(diningTables).set({ qrTokenHash: hashQrToken(generateQrToken()), updatedAt: new Date() }).where(eq(diningTables.id, row.id));
  await db.delete(diningTables).where(eq(diningTables.id, row.id));
});

test("phase8 qr checkout manual transfer: creates SUBMITTED/PENDING order, reservation, pending payment; idempotent", async () => {
  // Ensure settings enabled (dev branch only)
  await db.update(businessSettings).set({ qrOrderingEnabled: true, qrManualTransferEnabled: true, updatedAt: new Date() } as any).where(eq(businessSettings.id, "default"));
  const raw = generateQrToken();
  const [table] = await db.insert(diningTables).values({ businessId: DEFAULT_BUSINESS_ID, storeId: DEFAULT_STORE_ID, name: "P8T", tableNumber: uid("P8"), qrType:"TABLE", qrTokenHash: hashQrToken(raw), isActive: true }).returning();
  const pid = uid("p8p");
  await db.insert(products).values({ id: pid, businessId: DEFAULT_BUSINESS_ID, name:"P8 Prod", sku:`P8-${Date.now()}`, sellingPrice:"10000.00", costPrice:"4000.00", stockQuantity:5, minimumStock:0, unit:"pcs", status:"active", createdAt:new Date(), updatedAt:new Date() } as any);
  await db.insert(inventory).values({ businessId: DEFAULT_BUSINESS_ID, storeId: DEFAULT_STORE_ID, productId: pid, stockQuantity:5, reservedQuantity:0, minimumStock:0 } as any);
  const idem = uid("p8-idem"); let res:any;
  try {
    res = await executeQrCheckout({ qrToken: raw, idempotencyKey: idem, items:[{productId:pid, quantity:2}], paymentMethod:"manual_transfer", guest:{ name:"Guest A", phone:"08123" }, customer:{mode:"guest", name:"Guest A", phone:"08123"} });
    expect(res.orderId).toBeDefined(); expect(res.paymentId).toBeDefined();
    expect(res.orderSource).toBe("QR_TABLE"); expect(res.orderStatus).toBe("SUBMITTED"); expect(res.paymentStatus).toBe("PENDING");
    const [o] = await db.select().from(orders).where(eq(orders.id,res.orderId)).limit(1);
    expect(o?.customerId).toBeNull(); expect(o?.customerName).toBe("Guest A"); expect(o?.customerPhone).toBe("08123");
    const rs = await db.select().from(inventoryReservations).where(eq(inventoryReservations.orderId,res.orderId));
    expect(rs.length).toBe(1); expect(rs[0].status).toBe("RESERVED"); expect(rs[0].quantity).toBe(2);
    const [inv] = await db.select().from(inventory).where(eq(inventory.productId,pid)).limit(1);
    expect(inv.reservedQuantity).toBe(2); // on-hand not yet deducted for pending manual order
    const ps = await db.select().from(payments).where(eq(payments.id,res.paymentId));
    expect(ps.length).toBe(1); expect(String(ps[0].status).toUpperCase()).toBe("PENDING");
    const res2 = await executeQrCheckout({ qrToken: raw, idempotencyKey: idem, items:[{productId:pid, quantity:2}], paymentMethod:"manual_transfer", guest:{ name:"Guest A", phone:"08123" }, customer:{mode:"guest", name:"Guest A", phone:"08123"} });
    expect(res2.orderId).toBe(res.orderId);
    const rs2 = await db.select().from(inventoryReservations).where(eq(inventoryReservations.orderId,res.orderId));
    expect(rs2.length).toBe(1);
  } finally {
    try { await db.delete(checkoutIdempotency).where(eq(checkoutIdempotency.key, idem)); } catch {}
    try { if(res?.orderId) await db.delete(orders).where(eq(orders.id,res.orderId)); } catch {}
    try { await db.delete(inventory).where(eq(inventory.productId,pid)); } catch {}
    try { await db.delete(products).where(eq(products.id,pid)); } catch {}
    try { await db.delete(diningTables).where(eq(diningTables.id,table.id)); } catch {}
  }
});
