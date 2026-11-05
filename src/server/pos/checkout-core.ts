import crypto from "crypto";
import { and, eq, inArray, sql } from "drizzle-orm";

import {
  businessSettings,
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
  taxRates,
  transactionDiscounts,
  transactionItems,
  transactions,
} from "@/server/db/schema";

export type PosCheckoutPayload = {
  idempotencyKey: string;
  items: { productId: string; quantity: number }[];
  paymentMethod: "cash" | "card" | "qris" | "manual_transfer";
  paymentAmount?: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  orderType: "dine-in" | "takeaway";
  tableNumber?: string;
  discount: number;
  cashier?: string;
};

export function hashCheckoutRequest(payload: PosCheckoutPayload) {
  const canonicalItems = [...payload.items].sort((a, b) =>
    a.productId.localeCompare(b.productId)
  );
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        items: canonicalItems,
        paymentMethod: payload.paymentMethod,
        paymentAmount: payload.paymentAmount,
        customerId: payload.customerId,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        orderType: payload.orderType,
        tableNumber: payload.tableNumber,
        discount: payload.discount,
      })
    )
    .digest("hex");
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function generateTransactionNumber() {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TRX-${y}${m}${d}-${rand}`;
}

function generateOrderNumber() {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${y}${m}${d}-${rand}`;
}

export type CheckoutError = Error & { status?: number };

export async function executePosCheckout(
  db: any,
  payload: PosCheckoutPayload,
  user: { id: string; name?: string | null }
) {
  const requestHash = hashCheckoutRequest(payload);
  const canonicalItems = [...payload.items].sort((a, b) =>
    a.productId.localeCompare(b.productId)
  );

  const result = await db.transaction(async (tx: any) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${payload.idempotencyKey}))`
    );

    const existing = await tx
      .select()
      .from(checkoutIdempotency)
      .where(eq(checkoutIdempotency.key, payload.idempotencyKey))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].requestHash !== requestHash) {
        const conflict = new Error(
          "Idempotency key dipakai dengan payload berbeda."
        ) as CheckoutError;
        conflict.status = 409;
        throw conflict;
      }
      if (existing[0].response) {
        return { cached: JSON.parse(existing[0].response) as unknown };
      }
    }

    const productIds = [...new Set(canonicalItems.map((item) => item.productId))].sort();
    const productRows = await tx
      .select()
      .from(products)
      .where(inArray(products.id, productIds))
      .orderBy(products.id)
      .for("update");

    const inventoryRows = await tx
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.storeId, DEFAULT_STORE_ID),
          inArray(inventory.productId, productIds)
        )
      )
      .orderBy(inventory.productId)
      .for("update");

    const productById = new Map(productRows.map((row: any) => [row.id, row]));
    const inventoryByProduct = new Map(
      inventoryRows.map((row: any) => [row.productId, row])
    );

    const [settings] = await tx
      .select()
      .from(businessSettings)
      .where(eq(businessSettings.id, "default"))
      .limit(1);
    const [defaultTaxRate] = await tx
      .select()
      .from(taxRates)
      .where(
        and(
          eq(taxRates.businessId, DEFAULT_BUSINESS_ID),
          eq(taxRates.isDefault, true)
        )
      )
      .limit(1);
    const taxRate = settings
      ? Number(settings.taxRate)
      : Number(defaultTaxRate?.rate ?? 0);

    const items: {
      productId: string;
      name: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      costPrice: string;
    }[] = [];
    let subtotal = 0;

    for (const item of canonicalItems) {
      const product = productById.get(item.productId) as any;
      if (!product) throw new Error(`Produk ${item.productId} tidak ditemukan.`);
      if (product.status !== "active") {
        throw new Error(`Produk ${product.name} sedang tidak tersedia.`);
      }
      const inventoryRow = inventoryByProduct.get(item.productId) as any;
      const available = inventoryRow?.stockQuantity ?? product.stockQuantity;
      if (available < item.quantity) {
        throw new Error(`Stok ${product.name} tidak cukup.`);
      }
      const unitPrice = Number(product.sellingPrice);
      const lineTotal = roundMoney(unitPrice * item.quantity);
      subtotal += lineTotal;
      items.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        costPrice: product.costPrice,
      });
    }

    subtotal = roundMoney(subtotal);
    const discount = roundMoney(Math.min(payload.discount, subtotal));
    const taxableSubtotal = roundMoney(subtotal - discount);
    const tax = roundMoney(taxableSubtotal * taxRate);
    const total = roundMoney(taxableSubtotal + tax);
    const paid =
      payload.paymentMethod === "cash"
        ? roundMoney(payload.paymentAmount ?? total)
        : total;
    if (payload.paymentMethod === "cash" && paid < total) {
      throw new Error("Nominal pembayaran kurang.");
    }
    const change = roundMoney(Math.max(0, paid - total));

    // POS checkout in this phase is a completed paid flow (cash/card/qris/manual at cashier).
    const isPaidNow = payload.paymentMethod === "cash" || payload.paymentMethod === "card" || payload.paymentMethod === "qris" || payload.paymentMethod === "manual_transfer";
    const paymentStatusLegacy = isPaidNow ? "paid" : "pending";
    const paymentStatusOrder = isPaidNow ? "PAID" : "PENDING";

    const orderId = crypto.randomUUID();
    const orderNumber = generateOrderNumber();
    const transactionId = crypto.randomUUID();
    const transactionNumber = generateTransactionNumber();
    const createdAt = new Date();
    const cashierName = payload.cashier || user.name || "Kasir";

    const [transaction] = await tx
      .insert(transactions)
      .values({
        id: transactionId,
        businessId: DEFAULT_BUSINESS_ID,
        storeId: DEFAULT_STORE_ID,
        transactionNumber,
        cashierId: user.id,
        cashierName,
        customerId: payload.customerId ?? null,
        customerName: payload.customerName ?? "Umum",
        orderType: payload.orderType,
        tableNumber: payload.tableNumber ?? null,
        paymentMethod: payload.paymentMethod,
        paymentStatus: paymentStatusLegacy,
        taxRateId: defaultTaxRate?.id ?? null,
        subtotal: subtotal.toFixed(2),
        discountTotal: discount.toFixed(2),
        taxTotal: tax.toFixed(2),
        grandTotal: total.toFixed(2),
        amountPaid: paid.toFixed(2),
        changeAmount: change.toFixed(2),
        status: "completed",
        createdAt,
        updatedAt: createdAt,
      })
      .returning();

    await tx.insert(orders).values({
      id: orderId,
      businessId: DEFAULT_BUSINESS_ID,
      storeId: DEFAULT_STORE_ID,
      orderNumber,
      orderSource: "POS",
      orderStatus: "COMPLETED",
      paymentStatus: paymentStatusOrder,
      customerId: payload.customerId ?? null,
      customerName: payload.customerName ?? "Umum",
      customerPhone: payload.customerPhone ?? null,
      cashierId: user.id,
      cashierName,
      orderType: payload.orderType,
      tableNumber: payload.tableNumber ?? null,
      paymentMethod: payload.paymentMethod,
      currency: "IDR",
      subtotal: subtotal.toFixed(2),
      discountTotal: discount.toFixed(2),
      taxTotal: tax.toFixed(2),
      grandTotal: total.toFixed(2),
      amountPaid: paid.toFixed(2),
      changeAmount: change.toFixed(2),
      idempotencyKey: payload.idempotencyKey,
      linkedTransactionId: transactionId,
      submittedAt: createdAt,
      paidAt: isPaidNow ? createdAt : null,
      completedAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    });

    for (const item of items) {
      const product = productById.get(item.productId) as any;
      const inventoryRow = inventoryByProduct.get(item.productId) as any;
      const available = inventoryRow?.stockQuantity ?? product.stockQuantity;
      const nextStock = available - item.quantity;

      await tx.insert(orderItems).values({
        id: crypto.randomUUID(),
        orderId,
        productId: item.productId,
        productName: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        discountTotal: "0.00",
        taxTotal: "0.00",
        subtotal: item.lineTotal.toFixed(2),
        createdAt,
      });
      await tx.insert(transactionItems).values({
        id: crypto.randomUUID(),
        transactionId,
        productId: item.productId,
        productName: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        lineTotal: item.lineTotal.toFixed(2),
        costPrice: item.costPrice,
        createdAt,
      });
      await tx
        .update(products)
        .set({
          stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(products.id, item.productId));
      await tx
        .insert(inventory)
        .values({
          businessId: DEFAULT_BUSINESS_ID,
          storeId: DEFAULT_STORE_ID,
          productId: item.productId,
          stockQuantity: nextStock,
          minimumStock: inventoryRow?.minimumStock ?? product.minimumStock,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [inventory.productId, inventory.storeId],
          set: { stockQuantity: nextStock, updatedAt: new Date() },
        });
      await tx.insert(stockMovements).values({
        id: crypto.randomUUID(),
        businessId: DEFAULT_BUSINESS_ID,
        storeId: DEFAULT_STORE_ID,
        productId: item.productId,
        productName: item.name,
        movementType: "sale",
        quantity: -item.quantity,
        stockAfter: nextStock,
        unitCost: item.costPrice,
        note: `Penjualan ${transactionNumber}`,
        staffName: cashierName,
        referenceType: "transaction",
        referenceId: transactionId,
        createdAt,
      });
    }

    await tx.insert(payments).values({
      transactionId,
      orderId,
      channel: "POS",
      currency: "IDR",
      paymentMethod: payload.paymentMethod,
      amount: paid.toFixed(2),
      status: isPaidNow ? "completed" : "pending",
      paidAt: isPaidNow ? createdAt : createdAt,
    } as any);

    if (discount > 0) {
      await tx.insert(transactionDiscounts).values({
        transactionId,
        name: "Diskon manual",
        type: "fixed",
        value: discount.toFixed(2),
        amount: discount.toFixed(2),
        createdAt,
      });
    }

    await tx.insert(orderStatusHistory).values({
      orderId,
      fromOrderStatus: null,
      toOrderStatus: "COMPLETED",
      fromPaymentStatus: null,
      toPaymentStatus: paymentStatusOrder,
      changedByUserId: user.id,
      changedByRole: "cashier",
      reason: "POS checkout completed",
      createdAt,
    } as any);

    const response = {
      orderId,
      orderNumber,
      order: {
        id: orderId,
        number: orderNumber,
        source: "POS",
        orderStatus: "COMPLETED",
        paymentStatus: paymentStatusOrder,
        linkedTransactionId: transactionId,
      },
      transaction: {
        id: transaction.id,
        number: transaction.transactionNumber,
        createdAt: transaction.createdAt.toISOString(),
        cashier: cashierName,
        customerId: payload.customerId,
        customerName: payload.customerName ?? "Umum",
        orderType: payload.orderType,
        tableNumber: payload.tableNumber,
        items,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod: payload.paymentMethod,
        cashReceived: paid,
        change,
        status: "completed",
      },
      transactionId: transaction.id,
      transactionNumber: transaction.transactionNumber,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod: transaction.paymentMethod,
      amountPaid: paid,
      changeAmount: change,
      items,
      status: transaction.status,
      createdAt: transaction.createdAt.toISOString(),
    };

    await tx
      .insert(checkoutIdempotency)
      .values({
        key: payload.idempotencyKey,
        requestHash,
        transactionId,
        orderId,
        response: JSON.stringify(response),
        createdAt,
        expiresAt: new Date(Date.now() + 86400000),
      } as any)
      .onConflictDoUpdate({
        target: checkoutIdempotency.key,
        set: {
          transactionId,
          orderId,
          response: JSON.stringify(response),
        } as any,
      });

    return { response };
  });

  if ("cached" in result) return result.cached;
  return result.response;
}
