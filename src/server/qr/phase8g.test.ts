import { test, expect } from "bun:test";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/server/db";
import {
  DEFAULT_BUSINESS_ID, DEFAULT_STORE_ID, products, inventory, diningTables,
  orders, payments, inventoryReservations, checkoutIdempotency, businessSettings,
  guestOrderAccess, transactions, transactionItems, stockMovements,
} from "@/server/db/schema";
import { generateQrToken, hashQrToken } from "@/server/qr/token";
import { executeQrCheckout } from "@/server/qr/checkout";
import { verifyManualPayment, submitPaymentProof } from "@/server/qr/payments";
import { createGuestOrderAccess, resolveGuestAccess, hashGuestToken, revokeGuestAccessByToken } from "@/server/qr/guest-access";
import { storePaymentProof } from "@/server/storage/payment-proof";

const uid = (p:string)=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

async function setup(stock=10) {
  await db.update(businessSettings).set({ qrOrderingEnabled: true, qrManualTransferEnabled: true, updatedAt: new Date() } as any).where(eq(businessSettings.id,"default"));
  const raw = generateQrToken();
  const [table] = await db.insert(diningTables).values({ businessId: DEFAULT_BUSINESS_ID, storeId: DEFAULT_STORE_ID, name:"G8", tableNumber: uid("G8"), qrType:"TABLE", qrTokenHash: hashQrToken(raw), isActive:true }).returning();
  const pid = uid("g8p");
  await db.insert(products).values({ id: pid, businessId: DEFAULT_BUSINESS_ID, name:"G8 Prod", sku:`G8-${Date.now()}-${Math.random().toString(36).slice(2,4)}`, sellingPrice:"10000.00", costPrice:"4000.00", stockQuantity:stock, minimumStock:0, unit:"pcs", status:"active", isStockTracked:true, createdAt:new Date(), updatedAt:new Date() } as any);
  await db.insert(inventory).values({ businessId: DEFAULT_BUSINESS_ID, storeId: DEFAULT_STORE_ID, productId: pid, stockQuantity:stock, reservedQuantity:0, minimumStock:0 } as any);
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

test("8G.5 guest access: token hash stored/raw not stored; valid resolves; invalid/missing/wrong-order/revoked/expired rejected", async () => {
  const { raw, table, pid } = await setup(); const idem=uid("g8tok"); let res:any;
  try {
    res = await executeQrCheckout({ qrToken: raw, idempotencyKey: idem, items:[{productId:pid,quantity:1}], paymentMethod:"manual_transfer", customer:{mode:"guest",name:"G",phone:"08"} });
    const rawToken = res._guestAccessRaw;
    expect(typeof rawToken).toBe("string"); expect(rawToken.length).toBeGreaterThan(30);
    const rows = await db.select().from(guestOrderAccess).where(eq(guestOrderAccess.orderId,res.orderId));
    expect(rows.length).toBe(1); expect(rows[0].tokenHash).toMatch(/^[a-f0-9]{64}$/); expect(rows[0].tokenHash).not.toBe(rawToken);
    expect(await resolveGuestAccess(res.orderId, rawToken)).toBeTruthy();
    expect(await resolveGuestAccess(res.orderId, "wrongtoken")).toBeNull();
    expect(await resolveGuestAccess(res.orderId, null)).toBeNull();
    expect(await resolveGuestAccess(uid("other-order"), rawToken)).toBeNull();
    // expired
    const exp = await createGuestOrderAccess(res.orderId, -1);
    expect(await resolveGuestAccess(res.orderId, exp.rawToken)).toBeNull();
    // revoked
    await revokeGuestAccessByToken(res.orderId, rawToken);
    expect(await resolveGuestAccess(res.orderId, rawToken)).toBeNull();
  } finally { await cleanup(res,pid,table.id,idem); }
});

test("8G.5 idempotent checkout retry does not expose raw guest token again", async () => {
  const { raw, table, pid } = await setup(); const idem=uid("g8idemraw"); let res:any;
  try {
    const payload = { qrToken: raw, idempotencyKey: idem, items:[{productId:pid,quantity:1}], paymentMethod:"manual_transfer" as const, customer:{mode:"guest" as const,name:"G",phone:"08"} };
    res = await executeQrCheckout(payload);
    expect(res._guestAccessRaw).toBeTruthy();
    const res2 = await executeQrCheckout(payload);
    expect(res2.orderId).toBe(res.orderId);
    expect(res2._guestAccessRaw).toBeUndefined(); // cached/idempotent must not reissue
  } finally { await cleanup(res,pid,table.id,idem); }
});

test("8G.6 fulfillment: creates 1 Transaction+Items snapshot, links payment, converts reservation, deducts on-hand once, stock movement once; duplicate/idempotent", async () => {
  const { raw, table, pid } = await setup(); const idem=uid("g8ful"); let res:any;
  try {
    res = await executeQrCheckout({ qrToken: raw, idempotencyKey: idem, items:[{productId:pid,quantity:2}], paymentMethod:"manual_transfer", customer:{mode:"guest",name:"G",phone:"08"} });
    const v1 = await verifyManualPayment({ paymentId: res.paymentId, action:"approve", staffUserId:"staff-1" });
    expect(v1.ok).toBe(true); expect(v1.status).toBe("PAID"); expect(v1.transactionId).toBeDefined();
    const [pay] = await db.select().from(payments).where(eq(payments.id,res.paymentId)).limit(1);
    expect(String(pay.status).toUpperCase()).toBe("PAID"); expect(pay.transactionId).toBe(v1.transactionId);
    const txs = await db.select().from(transactions).where(eq(transactions.id, String(v1.transactionId)));
    expect(txs.length).toBe(1); expect(txs[0].status).toBe("completed");
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
    expect((await db.select().from(transactionItems).where(eq(transactionItems.transactionId, String(v1.transactionId)))).length).toBe(1);
    expect((await db.select().from(stockMovements).where(eq(stockMovements.referenceId,res.orderId))).length).toBe(1);
    const [inv2] = await db.select().from(inventory).where(eq(inventory.productId,pid)).limit(1);
    expect(inv2.stockQuantity).toBe(8); expect(inv2.reservedQuantity).toBe(0);
  } finally { await cleanup(res,pid,table.id,idem); }
});

test("8G.6 amount/currency mismatch rejected; no fulfillment side effects", async () => {
  const { raw, table, pid } = await setup(); const idem=uid("g8amt"); let res:any;
  try {
    res = await executeQrCheckout({ qrToken: raw, idempotencyKey: idem, items:[{productId:pid,quantity:1}], paymentMethod:"manual_transfer", customer:{mode:"guest",name:"G",phone:"08"} });
    await db.update(payments).set({ amount: "9999.00" } as any).where(eq(payments.id,res.paymentId));
    let err:any; try { await verifyManualPayment({ paymentId: res.paymentId, action:"approve", staffUserId:"s" }); } catch(e){err=e;}
    expect(err).toBeTruthy();
    const [pay] = await db.select().from(payments).where(eq(payments.id,res.paymentId)).limit(1);
    expect(pay.transactionId).toBeFalsy();
    const [inv] = await db.select().from(inventory).where(eq(inventory.productId,pid)).limit(1);
    expect(inv.stockQuantity).toBe(10); // unchanged
  } finally { await cleanup(res,pid,table.id,idem); }
});

test("8G.6 expired/cancelled order cannot be approved; reject does not set PAID", async () => {
  const { raw, table, pid } = await setup(); const idem=uid("g8exp"); let res:any;
  try {
    res = await executeQrCheckout({ qrToken: raw, idempotencyKey: idem, items:[{productId:pid,quantity:1}], paymentMethod:"manual_transfer", customer:{mode:"guest",name:"G",phone:"08"} });
    await db.update(orders).set({ paymentStatus:"EXPIRED", updatedAt:new Date() }).where(eq(orders.id,res.orderId));
    await db.update(inventoryReservations).set({ status:"EXPIRED", expiresAt: new Date(Date.now()-60000), updatedAt:new Date() } as any).where(eq(inventoryReservations.orderId,res.orderId));
    let err:any; try { await verifyManualPayment({ paymentId: res.paymentId, action:"approve", staffUserId:"s" }); } catch(e){err=e;}
    expect(err).toBeTruthy(); expect(err.status).toBe(409);
    const [pay] = await db.select().from(payments).where(eq(payments.id,res.paymentId)).limit(1);
    expect(String(pay.status).toUpperCase()).not.toBe("PAID"); expect(pay.transactionId).toBeFalsy();

    const idem2=uid("g8can"); const res2 = await executeQrCheckout({ qrToken: raw, idempotencyKey: idem2, items:[{productId:pid,quantity:1}], paymentMethod:"manual_transfer", customer:{mode:"guest",name:"G",phone:"08"} });
    await db.update(orders).set({ orderStatus:"CANCELLED", updatedAt:new Date() }).where(eq(orders.id,res2.orderId));
    let err2:any; try { await verifyManualPayment({ paymentId: res2.paymentId, action:"approve", staffUserId:"s" }); } catch(e){err2=e;}
    expect(err2?.status).toBe(409);

    const idem3=uid("g8rej"); const res3 = await executeQrCheckout({ qrToken: raw, idempotencyKey: idem3, items:[{productId:pid,quantity:1}], paymentMethod:"manual_transfer", customer:{mode:"guest",name:"G",phone:"08"} });
    const rj = await verifyManualPayment({ paymentId: res3.paymentId, action:"reject", note:"bad", staffUserId:"s" });
    expect(rj.status).toBe("REJECTED");
    expect(String((await db.select().from(payments).where(eq(payments.id,res3.paymentId)).limit(1).then(r=>r[0])).status).toUpperCase()).toBe("REJECTED");
    for (const c of [[idem2,res2],[idem3,res3]] as any[]) { await db.delete(checkoutIdempotency).where(eq(checkoutIdempotency.key,c[0])); await db.delete(guestOrderAccess).where(eq(guestOrderAccess.orderId,c[1].orderId)); await db.delete(orders).where(eq(orders.id,c[1].orderId)); }
  } finally { await cleanup(res,pid,table.id,idem); }
});

test("8G.7 proof storage rejects spoofed/invalid signature and oversized file", async () => {
  let err:any; try { await storePaymentProof({ paymentId: uid("pf"), contentType:"image/png", bytes: new Uint8Array([1,2,3,4]) }); } catch(e){err=e;}
  expect(err?.status).toBe(400);
  const big = new Uint8Array(6 * 1024 * 1024); big.set([0x89,0x50,0x4e,0x47]);
  let err2:any; try { await storePaymentProof({ paymentId: uid("pf2"), contentType:"image/png", bytes: big }); } catch(e){err2=e;}
  expect(err2?.status).toBe(400);
});

test("8G.6 concurrency: competing checkouts on limited stock do not oversell/reserve negative", async () => {
  const { raw, table, pid } = await setup(1);
  const idems = [uid("g8race0"), uid("g8race1")];
  const results = await Promise.allSettled(idems.map((idem,i) => executeQrCheckout({ qrToken: raw, idempotencyKey: idem, items:[{productId:pid,quantity:1}], paymentMethod:"manual_transfer", customer:{mode:"guest",name:`G${i}`,phone:"08"} })));
  const ok = results.filter(r=>r.status==="fulfilled").map((r:any)=>r.value);
  expect(ok.length).toBeLessThanOrEqual(1);
  expect(results.length).toBe(2);
  const [inv] = await db.select().from(inventory).where(eq(inventory.productId,pid)).limit(1);
  expect(inv.reservedQuantity).toBeGreaterThanOrEqual(0); expect(inv.stockQuantity).toBeGreaterThanOrEqual(0);
  expect(inv.reservedQuantity).toBeLessThanOrEqual(1);
  for (let i=0;i<ok.length;i++) await cleanup(ok[i],pid,table.id,idems[results.findIndex(r=>r.status==="fulfilled" && (r as any).value===ok[i])]||idems[0]);
  for (const idem of idems) try{await db.delete(checkoutIdempotency).where(eq(checkoutIdempotency.key,idem));}catch{}
  try{await db.delete(inventory).where(eq(inventory.productId,pid));}catch{} try{await db.delete(products).where(eq(products.id,pid));}catch{} try{await db.delete(diningTables).where(eq(diningTables.id,table.id));}catch{}
});

test("8G.6 duplicate approval after fulfillment is idempotent (no duplicate tx/items/movement/stock)", async () => {
  const { raw, table, pid } = await setup(); const idem=uid("g8dup"); let res:any;
  try {
    res = await executeQrCheckout({ qrToken: raw, idempotencyKey: idem, items:[{productId:pid,quantity:1}], paymentMethod:"manual_transfer", customer:{mode:"guest",name:"G",phone:"08"} });
    const a = await verifyManualPayment({ paymentId: res.paymentId, action:"approve", staffUserId:"s1" });
    const b = await verifyManualPayment({ paymentId: res.paymentId, action:"approve", staffUserId:"s2" });
    expect(b.idempotent).toBe(true); expect(b.transactionId).toBe(a.transactionId);
    expect((await db.select().from(transactions).where(eq(transactions.id,String(a.transactionId)))).length).toBe(1);
    expect((await db.select().from(stockMovements).where(eq(stockMovements.referenceId,res.orderId))).length).toBe(1);
    const [inv] = await db.select().from(inventory).where(eq(inventory.productId,pid)).limit(1);
    expect(inv.stockQuantity).toBe(9);
  } finally { await cleanup(res,pid,table.id,idem); }
});

test("8G.7 multi-order guest cookies/tokens are independent; token cannot transfer between orders", async () => {
  const { raw, table, pid } = await setup(5); const idem1=uid("g8m1"), idem2=uid("g8m2"); let r1:any,r2:any;
  try {
    r1 = await executeQrCheckout({ qrToken: raw, idempotencyKey: idem1, items:[{productId:pid,quantity:1}], paymentMethod:"manual_transfer", customer:{mode:"guest",name:"G1",phone:"081"} });
    r2 = await executeQrCheckout({ qrToken: raw, idempotencyKey: idem2, items:[{productId:pid,quantity:1}], paymentMethod:"manual_transfer", customer:{mode:"guest",name:"G2",phone:"082"} });
    expect(r1._guestAccessRaw).toBeTruthy(); expect(r2._guestAccessRaw).toBeTruthy(); expect(r1._guestAccessRaw).not.toBe(r2._guestAccessRaw);
    expect(await resolveGuestAccess(r1.orderId, r1._guestAccessRaw)).toBeTruthy();
    expect(await resolveGuestAccess(r2.orderId, r2._guestAccessRaw)).toBeTruthy();
    expect(await resolveGuestAccess(r1.orderId, r2._guestAccessRaw)).toBeNull();
    expect(await resolveGuestAccess(r2.orderId, r1._guestAccessRaw)).toBeNull();
  } finally { await cleanup(r1,pid,table.id,idem1); await cleanup(r2,pid,table.id,idem2); }
});


test("8G.6 currency mismatch rejected", async () => {
  const { raw, table, pid } = await setup(); const idem=uid("g8cur"); let res:any;
  try {
    res = await executeQrCheckout({ qrToken: raw, idempotencyKey: idem, items:[{productId:pid,quantity:1}], paymentMethod:"manual_transfer", customer:{mode:"guest",name:"G",phone:"08"} });
    await db.update(payments).set({ currency: "USD" } as any).where(eq(payments.id,res.paymentId));
    let err:any; try { await verifyManualPayment({ paymentId: res.paymentId, action:"approve", staffUserId:"s" }); } catch(e){err=e;}
    expect(err?.status).toBe(400);
    expect((await db.select().from(payments).where(eq(payments.id,res.paymentId)).limit(1).then(r=>r[0])).transactionId).toBeFalsy();
  } finally { await cleanup(res,pid,table.id,idem); }
});

test("8G.6 concurrent approval requests: at most 1 transaction/fulfillment effect", async () => {
  const { raw, table, pid } = await setup(); const idem=uid("g8cap"); let res:any;
  try {
    res = await executeQrCheckout({ qrToken: raw, idempotencyKey: idem, items:[{productId:pid,quantity:1}], paymentMethod:"manual_transfer", customer:{mode:"guest",name:"G",phone:"08"} });
    const rs = await Promise.allSettled([
      verifyManualPayment({ paymentId: res.paymentId, action:"approve", staffUserId:"s1" }),
      verifyManualPayment({ paymentId: res.paymentId, action:"approve", staffUserId:"s2" }),
    ]);
    const ok = rs.filter(r=>r.status==="fulfilled") as any[];
    expect(ok.length).toBeGreaterThanOrEqual(1);
    const txIds = [...new Set(ok.map(r=>r.value.transactionId).filter(Boolean))];
    expect(txIds.length).toBe(1);
    const [inv] = await db.select().from(inventory).where(eq(inventory.productId,pid)).limit(1);
    expect(inv.stockQuantity).toBe(9); expect(inv.reservedQuantity).toBe(0);
    expect((await db.select().from(stockMovements).where(eq(stockMovements.referenceId,res.orderId))).length).toBe(1);
  } finally { await cleanup(res,pid,table.id,idem); }
});
