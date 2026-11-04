import crypto from "crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { db } from "@/server/db";
import {
  checkoutIdempotency,
  products,
  stockMovements,
  transactionItems,
  transactions,
} from "@/server/db/schema";

const CheckoutSchema = z.object({
  idempotencyKey: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  paymentMethod: z.enum(["cash", "card", "qris"]),
  paymentAmount: z.number().positive().optional(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  orderType: z.enum(["dine-in", "takeaway"]).default("dine-in"),
  tableNumber: z.string().optional(),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  cashier: z.string().optional(),
});

function hashRequest(body: unknown) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(body))
    .digest("hex");
}

function generateTransactionNumber() {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TRX-${y}${m}${d}-${rand}`;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const user =
      (session as any)?.user ?? (session as any)?.data?.user ?? null;

    if (!user) {
      return NextResponse.json(
        { error: "Checkout hanya tersedia untuk akun terdaftar." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data checkout tidak valid.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const requestHash = hashRequest({
      items: payload.items,
      paymentMethod: payload.paymentMethod,
      paymentAmount: payload.paymentAmount,
      discount: payload.discount,
      tax: payload.tax,
    });

    const existing = await db
      .select()
      .from(checkoutIdempotency)
      .where(eq(checkoutIdempotency.key, payload.idempotencyKey))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].requestHash !== requestHash) {
        return NextResponse.json(
          { error: "Idempotency key dipakai dengan payload berbeda." },
          { status: 409 }
        );
      }
      if (existing[0].response) {
        return NextResponse.json(JSON.parse(existing[0].response));
      }
    }

    const result = await db.transaction(async (tx) => {
      const productIds = payload.items.map((item) => item.productId);
      const productRows = await tx
        .select()
        .from(products)
        .where(inArray(products.id, productIds))
        .for("update");

      const productById = new Map(productRows.map((row) => [row.id, row]));
      const items: {
        productId: string;
        name: string;
        sku: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }[] = [];
      let subtotal = 0;

      for (const item of payload.items) {
        const product = productById.get(item.productId);
        if (!product) {
          throw new Error(`Produk ${item.productId} tidak ditemukan.`);
        }
        if (product.status !== "active") {
          throw new Error(`Produk ${product.name} sedang tidak tersedia.`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Stok ${product.name} tidak cukup.`);
        }

        const unitPrice = Number(product.price);
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;
        items.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        });
      }

      const discount = Math.min(payload.discount, subtotal);
      const tax = payload.tax;
      const total = Math.max(0, subtotal - discount + tax);
      const paid = payload.paymentAmount ?? total;

      if (payload.paymentMethod === "cash" && paid < total) {
        throw new Error("Nominal pembayaran kurang.");
      }

      const change = Math.max(0, paid - total);
      const transactionId = crypto.randomUUID();
      const transactionNumber = generateTransactionNumber();
      const createdAt = new Date();
      const cashierName = payload.cashier || user.name || "Kasir";

      const [transaction] = await tx
        .insert(transactions)
        .values({
          id: transactionId,
          number: transactionNumber,
          cashierId: user.id,
          cashierName,
          customerId: payload.customerId ?? null,
          customerName: payload.customerName ?? "Umum",
          orderType: payload.orderType,
          tableNumber: payload.tableNumber ?? null,
          paymentMethod: payload.paymentMethod,
          subtotal: subtotal.toFixed(2),
          discount: discount.toFixed(2),
          tax: tax.toFixed(2),
          total: total.toFixed(2),
          amountPaid: paid.toFixed(2),
          changeAmount: change.toFixed(2),
          status: "completed",
          createdAt,
        })
        .returning();

      for (const item of items) {
        await tx.insert(transactionItems).values({
          id: crypto.randomUUID(),
          transactionId,
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          lineTotal: item.lineTotal.toFixed(2),
        });

        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));

        await tx.insert(stockMovements).values({
          id: crypto.randomUUID(),
          productId: item.productId,
          productName: item.name,
          type: "sale",
          quantity: -item.quantity,
          stockAfter: (productById.get(item.productId)?.stock ?? 0) - item.quantity,
          note: `Penjualan ${transactionNumber}`,
          staff: cashierName,
          referenceId: transactionId,
          createdAt,
        });
      }

      const response = {
        transaction: {
          id: transaction.id,
          number: transaction.number,
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
        transactionNumber: transaction.number,
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

      if (existing.length === 0) {
        await tx.insert(checkoutIdempotency).values({
          key: payload.idempotencyKey,
          requestHash,
          transactionId: transaction.id,
          response: JSON.stringify(response),
        });
      } else {
        await tx
          .update(checkoutIdempotency)
          .set({
            transactionId: transaction.id,
            response: JSON.stringify(response),
          })
          .where(eq(checkoutIdempotency.key, payload.idempotencyKey));
      }

      return response;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Checkout error:", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || "Checkout gagal." },
      { status: 400 }
    );
  }
}
