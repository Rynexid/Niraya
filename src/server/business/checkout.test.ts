import { test, expect } from "bun:test";
import { eq, inArray, sql } from "drizzle-orm";
import crypto from "crypto";

import { db } from "@/server/db";
import {
  checkoutIdempotency,
  products,
  stockMovements,
  transactionItems,
  transactions,
} from "@/server/db/schema";

function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function hashRequest(body: unknown) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(body))
    .digest("hex");
}

test("checkout persists transaction, deducts stock, records movement atomically", async () => {
  // Buat produk dengan stok yang diketahui.
  const productId = uniqueId("prod-checkout");
  await db.insert(products).values({
    id: productId,
    name: "Produk Checkout Tes",
    sku: `CO-${Date.now()}`,
    barcode: null,
    categoryId: "bakery",
    price: "10000.00",
    cost: "4000.00",
    stock: 10,
    minStock: 1,
    unit: "pcs",
    imageUrl: null,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const idempotencyKey = `checkout-${uniqueId("key")}`;
  const items = [{ productId, quantity: 3 }];
  const requestHash = hashRequest({ items, paymentMethod: "cash", discount: 0, tax: 0 });

  const transactionId = crypto.randomUUID();
  const transactionNumber = `TRX-TEST-${Date.now().toString(36).slice(2, 8).toUpperCase()}`;
  const createdAt = new Date();
  const subtotal = 30000;
  const discount = 0;
  const tax = 0;
  const total = 30000;
  const paid = 30000;
  const change = 0;

  await db.transaction(async (tx) => {
    // Lock baris stok produk.
    const productRows = await tx
      .select()
      .from(products)
      .where(inArray(products.id, [productId]))
      .for("update");

    const product = productRows[0];
    if (!product || product.stock < 3) {
      throw new Error("Stok tidak cukup");
    }

    // Simpan transaksi.
    await tx.insert(transactions).values({
      id: transactionId,
      number: transactionNumber,
      cashierId: "test-user",
      cashierName: "Tes Otomatis",
      customerId: null,
      customerName: "Umum",
      orderType: "dine-in",
      tableNumber: null,
      paymentMethod: "cash",
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      amountPaid: paid.toFixed(2),
      changeAmount: change.toFixed(2),
      status: "completed",
      createdAt,
    });

    // Simpan item transaksi.
    await tx.insert(transactionItems).values({
      id: crypto.randomUUID(),
      transactionId,
      productId,
      name: "Produk Checkout Tes",
      sku: `CO-${Date.now()}`,
      quantity: 3,
      unitPrice: "10000.00",
      lineTotal: "30000.00",
    });

    // Kurangi stok.
    await tx
      .update(products)
      .set({ stock: sql`${products.stock} - 3`, updatedAt: new Date() })
      .where(eq(products.id, productId));

    // Catat gerakan stok.
    await tx.insert(stockMovements).values({
      id: crypto.randomUUID(),
      productId,
      productName: "Produk Checkout Tes",
      type: "sale",
      quantity: -3,
      stockAfter: product.stock - 3,
      note: `Penjualan ${transactionNumber}`,
      staff: "Tes Otomatis",
      referenceId: transactionId,
      createdAt,
    });

    // Simpan idempotency.
    await tx.insert(checkoutIdempotency).values({
      key: idempotencyKey,
      requestHash,
      transactionId,
      response: JSON.stringify({ ok: true }),
      createdAt,
      expiresAt: new Date(Date.now() + 86400000),
    });
  });

  // Verifikasi transaksi tersimpan.
  const [txn] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);
  expect(txn).toBeDefined();
  expect(txn.number).toBe(transactionNumber);
  expect(Number(txn.total)).toBe(30000);
  expect(txn.status).toBe("completed");

  // Verifikasi item tersimpan.
  const itemsRows = await db
    .select()
    .from(transactionItems)
    .where(eq(transactionItems.transactionId, transactionId));
  expect(itemsRows.length).toBe(1);
  expect(itemsRows[0].quantity).toBe(3);

  // Verifikasi stok dikurangi.
  const [afterProduct] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  expect(afterProduct.stock).toBe(7);

  // Verifikasi gerakan stok dicatat.
  const movements = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.referenceId, transactionId));
  expect(movements.length).toBe(1);
  expect(movements[0].type).toBe("sale");
  expect(movements[0].quantity).toBe(-3);
  expect(movements[0].stockAfter).toBe(7);

  // Verifikasi idempotency tersimpan.
  const [idempotent] = await db
    .select()
    .from(checkoutIdempotency)
    .where(eq(checkoutIdempotency.key, idempotencyKey))
    .limit(1);
  expect(idempotent).toBeDefined();
  expect(idempotent.requestHash).toBe(requestHash);

  // Bersihkan.
  await db.delete(checkoutIdempotency).where(eq(checkoutIdempotency.key, idempotencyKey));
  await db.delete(transactions).where(eq(transactions.id, transactionId));
  await db.delete(transactionItems).where(eq(transactionItems.transactionId, transactionId));
  await db.delete(stockMovements).where(eq(stockMovements.referenceId, transactionId));
  await db.delete(products).where(eq(products.id, productId));
});

test("checkout rollback when stock insufficient", async () => {
  const productId = uniqueId("prod-rollback");
  await db.insert(products).values({
    id: productId,
    name: "Produk Rollback Tes",
    sku: `RB-${Date.now()}`,
    barcode: null,
    categoryId: "bakery",
    price: "10000.00",
    cost: "4000.00",
    stock: 1, // cuma 1 stok
    minStock: 1,
    unit: "pcs",
    imageUrl: null,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  let threw = false;
  try {
    await db.transaction(async (tx) => {
      const productRows = await tx
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .for("update");

      const product = productRows[0];
      if (!product || product.stock < 5) {
        throw new Error("Stok tidak cukup");
      }

      // Tidak akan sampai sini karena stok tidak cukup.
      await tx.insert(transactions).values({
        id: crypto.randomUUID(),
        number: "TRX-ROLLBACK",
        cashierId: "test-user",
        cashierName: "Tes",
        customerId: null,
        customerName: "Umum",
        orderType: "dine-in",
        tableNumber: null,
        paymentMethod: "cash",
        subtotal: "50000.00",
        discount: "0.00",
        tax: "0.00",
        total: "50000.00",
        amountPaid: "50000.00",
        changeAmount: "0.00",
        status: "completed",
        createdAt: new Date(),
      });
    });
  } catch (error) {
    threw = true;
    expect((error as Error).message).toBe("Stok tidak cukup");
  }
  expect(threw).toBe(true);

  // Stok harus tetap 1 (rollback).
  const [afterProduct] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  expect(afterProduct.stock).toBe(1);

  // Tidak boleh ada transaksi yang tersisa.
  const txns = await db
    .select()
    .from(transactions)
    .where(eq(transactions.number, "TRX-ROLLBACK"));
  expect(txns.length).toBe(0);

  await db.delete(products).where(eq(products.id, productId));
});
