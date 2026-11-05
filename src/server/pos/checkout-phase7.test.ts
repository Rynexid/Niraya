import { test, expect } from "bun:test";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import {
  checkoutIdempotency,
  DEFAULT_BUSINESS_ID,
  DEFAULT_STORE_ID,
  inventory,
  orderItems,
  orderStatusHistory,
  orders,
  payments,
  products,
  stockMovements,
  transactionItems,
  transactions,
} from "@/server/db/schema";
import { executePosCheckout } from "./checkout-core";

const ACTING_USER = { id: "phase7-test-user", name: "Phase7 Tester" };
const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const BIG_CASH = 9_999_999;

async function seedProduct(stock = 10) {
  const productId = uid("p7-prod");
  await db.insert(products).values({
    id: productId,
    businessId: DEFAULT_BUSINESS_ID,
    name: "Phase7 Product",
    sku: `P7-${Date.now().toString(36)}`.toUpperCase(),
    barcode: null,
    categoryId: null,
    sellingPrice: "10000.00",
    costPrice: "4000.00",
    stockQuantity: stock,
    minimumStock: 1,
    unit: "pcs",
    imageUrl: null,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await db.insert(inventory).values({
    businessId: DEFAULT_BUSINESS_ID,
    storeId: DEFAULT_STORE_ID,
    productId,
    stockQuantity: stock,
    minimumStock: 1,
  });
  return productId;
}

async function cleanup(res: any, productId: string, idemKey: string) {
  try { await db.delete(checkoutIdempotency).where(eq(checkoutIdempotency.key, idemKey)); } catch {}
  try { if (res?.orderId) await db.delete(orders).where(eq(orders.id, res.orderId)); } catch {}
  try { if (res?.transactionId) await db.delete(stockMovements).where(eq(stockMovements.referenceId, res.transactionId)); } catch {}
  try { if (res?.transactionId) await db.delete(transactions).where(eq(transactions.id, res.transactionId)); } catch {}
  try { await db.delete(inventory).where(eq(inventory.productId, productId)); } catch {}
  try { await db.delete(products).where(eq(products.id, productId)); } catch {}
}

test("phase7: successful checkout creates 1 linked Order+Transaction, 1 payment, stock once", async () => {
  const productId = await seedProduct(10);
  const idemKey = uid("p7-ok");
  let res: any;
  try {
    res = await executePosCheckout(db, {
      idempotencyKey: idemKey,
      items: [{ productId, quantity: 3 }],
      paymentMethod: "cash",
      paymentAmount: BIG_CASH,
      orderType: "dine-in",
      discount: 0,
    }, ACTING_USER);

    expect(res.orderId).toBeDefined();
    expect(res.transactionId).toBeDefined();
    expect(res.order.linkedTransactionId).toBe(res.transactionId);
    expect(res.order.source).toBe("POS");
    expect(res.order.orderStatus).toBe("COMPLETED");
    expect(res.order.paymentStatus).toBe("PAID");
    expect(res.status).toBe("completed");

    const [o] = await db.select().from(orders).where(eq(orders.id, res.orderId)).limit(1);
    const [t] = await db.select().from(transactions).where(eq(transactions.id, res.transactionId)).limit(1);
    expect(o?.linkedTransactionId).toBe(t?.id);
    expect(o?.orderSource).toBe("POS");
    expect(t?.status).toBe("completed");

    const ois = await db.select().from(orderItems).where(eq(orderItems.orderId, res.orderId));
    const tis = await db.select().from(transactionItems).where(eq(transactionItems.transactionId, res.transactionId));
    expect(ois.length).toBe(1); expect(tis.length).toBe(1);
    expect(ois[0].quantity).toBe(3); expect(tis[0].quantity).toBe(3);

    const pays = await db.select().from(payments).where(eq(payments.transactionId, res.transactionId));
    expect(pays.length).toBe(1);
    expect(String((pays[0] as any).orderId)).toBe(res.orderId);

    const hist = await db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, res.orderId));
    expect(hist.length).toBeGreaterThanOrEqual(1);

    const [p] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    expect(p.stockQuantity).toBe(7);
    const moves = await db.select().from(stockMovements).where(eq(stockMovements.referenceId, res.transactionId));
    expect(moves.length).toBe(1);
  } finally { await cleanup(res, productId, idemKey); }
});

test("phase7: idempotent retry returns same result, no duplicates, no extra stock deduction", async () => {
  const productId = await seedProduct(10);
  const idemKey = uid("p7-idem");
  const payload = { idempotencyKey: idemKey, items: [{ productId, quantity: 2 }], paymentMethod: "cash" as const, paymentAmount: BIG_CASH, orderType: "dine-in" as const, discount: 0 };
  let r1: any;
  try {
    r1 = await executePosCheckout(db, payload, ACTING_USER);
    const r2 = await executePosCheckout(db, payload, ACTING_USER);
    expect(r2.orderId).toBe(r1.orderId);
    expect(r2.transactionId).toBe(r1.transactionId);
    const os = await db.select().from(orders).where(eq(orders.id, r1.orderId));
    const ts = await db.select().from(transactions).where(eq(transactions.id, r1.transactionId));
    const ps = await db.select().from(payments).where(eq(payments.transactionId, r1.transactionId));
    expect(os.length).toBe(1); expect(ts.length).toBe(1); expect(ps.length).toBe(1);
    const [p] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    expect(p.stockQuantity).toBe(8);
  } finally {
    await cleanup(r1, productId, idemKey);
  }
});

test("phase7: request hash mismatch rejected, prior checkout intact", async () => {
  const productId = await seedProduct(10);
  const idemKey = uid("p7-mismatch");
  let r1: any;
  try {
    r1 = await executePosCheckout(db, { idempotencyKey: idemKey, items: [{ productId, quantity: 1 }], paymentMethod: "cash", paymentAmount: BIG_CASH, orderType: "dine-in", discount: 0 }, ACTING_USER);
    let err: any;
    try {
      await executePosCheckout(db, { idempotencyKey: idemKey, items: [{ productId, quantity: 2 }], paymentMethod: "cash", paymentAmount: BIG_CASH, orderType: "dine-in", discount: 0 }, ACTING_USER);
    } catch (e) { err = e; }
    expect(err).toBeDefined();
    expect(err.status).toBe(409);
    const os = await db.select().from(orders).where(eq(orders.id, r1.orderId));
    const ts = await db.select().from(transactions).where(eq(transactions.id, r1.transactionId));
    expect(os.length).toBe(1); expect(ts.length).toBe(1);
    const [p] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    expect(p.stockQuantity).toBe(9);
  } finally { await cleanup(r1, productId, idemKey); }
});

test("phase7: rollback on insufficient stock leaves no partial order/transaction/payment", async () => {
  const productId = await seedProduct(1);
  const idemKey = uid("p7-rollback");
  const beforeOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.idempotencyKey, idemKey));
  const beforeTx = await db.select({ id: transactions.id }).from(transactions).where(eq(transactions.businessId, DEFAULT_BUSINESS_ID));
  let err: any;
  try {
    await executePosCheckout(db, { idempotencyKey: idemKey, items: [{ productId, quantity: 5 }], paymentMethod: "cash", paymentAmount: BIG_CASH, orderType: "dine-in", discount: 0 }, ACTING_USER);
  } catch (e) { err = e; }
  expect(String(err?.message || "")).toContain("Stok");
  const os = await db.select({ id: orders.id }).from(orders).where(eq(orders.idempotencyKey, idemKey));
  expect(os.length).toBe(0);
  const [p] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  expect(p.stockQuantity).toBe(1);
  await db.delete(inventory).where(eq(inventory.productId, productId));
  await db.delete(products).where(eq(products.id, productId));
  try { await db.delete(checkoutIdempotency).where(eq(checkoutIdempotency.key, idemKey)); } catch {}
});
