import { test, expect } from "bun:test";
import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import {
  DEFAULT_BUSINESS_ID, DEFAULT_STORE_ID, products, inventory, diningTables,
  orders, payments, inventoryReservations, checkoutIdempotency, businessSettings,
  guestOrderAccess, transactions, transactionItems, stockMovements,
} from "@/server/db/schema";
import { generateQrToken, hashQrToken } from "@/server/qr/token";
import { executeQrCheckout } from "@/server/qr/checkout";
import { verifyManualPayment } from "@/server/qr/payments";
import { createGuestOrderAccess, resolveGuestAccess, hashGuestToken } from "@/server/qr/guest-access";

const uid = (p:string)=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
const BIG = 9_999_999;

async function setup() {
  await db.update(businessSettings).set({ qrOrderingEnabled: true, qrManualTransferEnabled: true, updatedAt: new Date() } as any).where(eq(businessSettings.id,"default"));
  const raw = generateQrToken();
  const [table] = await db.insert(diningTables).values({ businessId: DEFAULT_BUSINESS_ID, storeId: DEFAULT_STORE_ID, name:"G8", tableNumber: uid("G8"), qrType:"TABLE", qrTokenHash: hashQrToken(raw), isActive:true }).returning();
  const pid = uid("g8p");
  await db.insert(products).values({ id: pid, businessId: DEFAULT_BUSINESS_ID, name:"G8 Prod", sku:`G8-${Date.now()}`, sellingPrice:"10000.00", costPrice:"4000.00", stockQuantity:10, minimumStock:0, unit:"pcs", status:"active", isStockTracked:true, createdAt:new Date(), updatedAt:new Date() } as any);
  await db.insert(inventory).values({ businessId: DEFAULT_BUSINESS_ID, storeId: DEFAULT_STORE_ID, productId: pid, stockQuantity:10, reservedQuantity:0, minimumStock:0 } as any);
  return { raw, table, pid };
}

async function cleanup(res:any, pid:string, tableId:string, idem:string) {
  try { await db.delete(checkoutIdempotency).where(eq(checkoutIdempotency.key, idem)); } catch {}
  try { if(res?.orderId) await db.delete(guestOrderAccess).where(eq(guestOrderAccess.orderId, res.orderId)); } catch {}
  try { if(res?.orderId) await db.delete(stockMovements).where(eq(stockMovements.referenceId, res.orderId)); } catch {}
  try { if(res?.orderId) { const os=await db.select().from(orders).where(eq(orders.id,res.orderId)); for(const o of os as any[]) if(o.linkedTransactionId){ try{await db.delete(transactions).where(eq(transactions.id,o.linkedTransactionId));}catch{} } } } catch {}
  try { if(res?.orderId) await db.delete(orders).where(eq(orders.id,res.orderId)); } catch {}
  try { await db.delete(inventory).where(eq(inventory.productId,pid)); } catch {}
  try { await db.delete(products).where(eq(products.id,pid)); } catch {}
  try { await db.delete(diningTables).where(eq(diningTables.id,tableId)); } catch {}
}

test("8G.1 guest access: token created, hash stored, raw not stored; valid resolves; invalid/wrong order rejected", async () => {
  const { raw, table, pid } = await setup(); const idem=uid("g8tok"); let res:any;
  try {
    res = await executeQrCheckout({ qrToken: raw, idempotencyKey: idem, items:[{productId:pid,quantity:1}], paymentMethod:"manual_transfer", customer:{mode:"guest",name:"G",phone:"08"} });
    const rawToken = res._guestAccessRaw;
    expect(typeof rawToken).toBe("string"); expect(rawToken.length).toBeGreaterThan(30);
    const rows = await db.select().from(guestOrderAccess).where(eq(guestOrderAccess.orderId,res.orderId));
    expect(rows.length).toBe(1); expect(rows[0].tokenHash).toMatch(/^[a-f0-9]{64}$/); expect(rows[0].tokenHash).not.toBe(rawToken);
    const ok = await resolveGuestAccess(res.orderId, rawToken); expect(ok).toBeTruthy();
    const bad = await resolveGuestAccess(res.orderId, "wrongtoken"); expect(bad).toBeNull();
    const other = await resolveGuestAccess(uid("other-order"), rawToken); expect(other).toBeNull();
  } finally { await cleanup(res,pid,table.id,idem); }
});

test("8G.2 QR fulfillment: approve creates 1 financial Transaction + items, links payment, deducts stock once, converts reservation; duplicate approve idempotent", async () => {
  const { raw, table, pid } = await setup(); const idem=uid("g8ful"); let res:any;
  try {
    res = await executeQrCheckout({ qrToken: raw, idempotencyKey: idem, items:[{productId:pid,quantity:2}], paymentMethod:"manual_transfer", customer:{mode:"guest",name:"G",phone:"08"} });
    const v1 = await verifyManualPayment({ paymentId: res.paymentId, action:"approve", staffUserId:"staff-1" });
    expect(v1.ok).toBe(true); expect(v1.status).toBe("PAID"); expect(v1.transactionId).toBeDefined();
    const [pay] = await db.select().from(payments).where(eq(payments.id,res.paymentId)).limit(1);
    expect(String(pay.status).toUpperCase()).toBe("PAID"); expect(pay.transactionId).toBe(v1.transactionId);
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, String(v1.transactionId))).limit(1);
    expect(tx).toBeTruthy(); expect(tx.status).toBe("completed");
    const tis = await db.select().from(transactionItems).where(eq(transactionItems.transactionId, String(v1.transactionId)));
    expect(tis.length).toBe(1); expect(tis[0].quantity).toBe(2); expect(tis[0].productId).toBe(pid);
    const rs = await db.select().from(inventoryReservations).where(eq(inventoryReservations.orderId,res.orderId));
    expect(rs.every((r:any)=>r.status==="CONVERTED")).toBe(true);
    const [inv] = await db.select().from(inventory).where(eq(inventory.productId,pid)).limit(1);
    expect(inv.stockQuantity).toBe(8); expect(inv.reservedQuantity).toBe(0);
    const [prod] = await db.select().from(products).where(eq(products.id,pid)).limit(1);
    expect(prod.stockQuantity).toBe(8);
    const moves = await db.select().from(stockMovements).where(eq(stockMovements.referenceId,res.orderId));
    expect(moves.length).toBe(1);
    const [ord] = await db.select().from(orders).where(eq(orders.id,res.orderId)).limit(1);
    expect(String(ord.paymentStatus).toUpperCase()).toBe("PAID"); expect(ord.linkedTransactionId).toBe(v1.transactionId);

    const v2 = await verifyManualPayment({ paymentId: res.paymentId, action:"approve", staffUserId:"staff-2" });
    expect(v2.idempotent).toBe(true);
    const tis2 = await db.select().from(transactionItems).where(eq(transactionItems.transactionId, String(v1.transactionId)));
    expect(tis2.length).toBe(1);
    const [inv2] = await db.select().from(inventory).where(eq(inventory.productId,pid)).limit(1);
    expect(inv2.stockQuantity).toBe(8);
    const moves2 = await db.select().from(stockMovements).where(eq(stockMovements.referenceId,res.orderId));
    expect(moves2.length).toBe(1);
  } finally { await cleanup(res,pid,table.id,idem); }
});

test("8G.2 expired reservation/order cannot be approved; reject does not set PAID", async () => {
  const { raw, table, pid } = await setup(); const idem=uid("g8exp"); let res:any;
  try {
    res = await executeQrCheckout({ qrToken: raw, idempotencyKey: idem, items:[{productId:pid,quantity:1}], paymentMethod:"manual_transfer", customer:{mode:"guest",name:"G",phone:"08"} });
    // simulate expiry
    await db.update(orders).set({ paymentStatus:"EXPIRED", updatedAt:new Date() }).where(eq(orders.id,res.orderId));
    await db.update(inventoryReservations).set({ status:"EXPIRED", expiresAt: new Date(Date.now()-60000), updatedAt:new Date() } as any).where(eq(inventoryReservations.orderId,res.orderId));
    let err:any; try { await verifyManualPayment({ paymentId: res.paymentId, action:"approve", staffUserId:"s" }); } catch(e){err=e;}
    expect(err).toBeTruthy(); expect(err.status).toBe(409);
    const [pay] = await db.select().from(payments).where(eq(payments.id,res.paymentId)).limit(1);
    expect(String(pay.status).toUpperCase()).not.toBe("PAID"); expect(pay.transactionId).toBeFalsy();

    // fresh order for reject
    const idem2=uid("g8rej"); const res2 = await executeQrCheckout({ qrToken: raw, idempotencyKey: idem2, items:[{productId:pid,quantity:1}], paymentMethod:"manual_transfer", customer:{mode:"guest",name:"G",phone:"08"} });
    const rj = await verifyManualPayment({ paymentId: res2.paymentId, action:"reject", note:"bad", staffUserId:"s" });
    expect(rj.status).toBe("REJECTED");
    const [pay2] = await db.select().from(payments).where(eq(payments.id,res2.paymentId)).limit(1);
    expect(String(pay2.status).toUpperCase()).toBe("REJECTED"); expect(pay2.transactionId).toBeFalsy();
    await db.delete(checkoutIdempotency).where(eq(checkoutIdempotency.key,idem2));
    await db.delete(guestOrderAccess).where(eq(guestOrderAccess.orderId,res2.orderId));
    await db.delete(orders).where(eq(orders.id,res2.orderId));
  } finally { await cleanup(res,pid,table.id,idem); }
});
