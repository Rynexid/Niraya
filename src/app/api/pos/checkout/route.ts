import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/server/db";
import { products, transactions, transactionItems, stockMovements, checkoutIdempotency } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

const CheckoutSchema = z.object({
  idempotencyKey: z.string().min(1),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1),
  paymentMethod: z.enum(["cash", "card", "qris"]),
  paymentAmount: z.number().positive().optional(),
});

function hashRequest(body: any) {
  return crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
}

function generateTransactionNumber() {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TRX-${y}${m}${d}-${rand}`;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const demo = cookieStore.get("niraya_demo")?.value;
    
    let user: any = null;
    if (demo === "1") {
      user = { id: "demo-user" };
    } else {
      const session: any = await auth.getSession({ headers: await headers() } as any);
      user = session?.user || session?.data?.user;
    }
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { idempotencyKey, items, paymentMethod, paymentAmount } = parsed.data;
    const requestHash = hashRequest({ items, paymentMethod, paymentAmount });

    // Check idempotency
    const existing = await db.select().from(checkoutIdempotency).where(eq(checkoutIdempotency.key, idempotencyKey));
    if (existing.length > 0) {
      if (existing[0].requestHash !== requestHash) {
        return NextResponse.json({ error: "Idempotency key reused with different payload" }, { status: 409 });
      }
      if (existing[0].response) {
        return NextResponse.json(JSON.parse(existing[0].response), { status: 200 });
      }
    }

    // Perform atomic checkout
    const result = await db.transaction(async (tx) => {
      // Lock and fetch products
      const productIds = items.map((i) => i.productId);
      const productRows = await tx.select().from(products).where(sql`${products.id} IN ${sql.raw(`(${productIds.map(id => `'${id}'`).join(',')})`)}`).for("update");

      let subtotal = 0;
      const orderItems: any[] = [];

      for (const item of items) {
        const product = productRows.find((p: any) => p.id === item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);
        if (product.status !== "active") throw new Error(`Product ${product.name} not available`);
        if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);

        const price = parseFloat(product.price);
        const itemSubtotal = price * item.quantity;
        subtotal += itemSubtotal;
        orderItems.push({ product, quantity: item.quantity, price, subtotal: itemSubtotal });
      }

      const total = subtotal;
      const paid = paymentAmount || total;
      const change = paid >= total ? paid - total : 0;

      if (paymentMethod === "cash" && paymentAmount && paymentAmount < total) {
        throw new Error("Insufficient payment");
      }

      const transactionNumber = generateTransactionNumber();

      const [transaction] = await tx.insert(transactions).values({
        number: transactionNumber,
        cashierId: user.id,
        paymentMethod,
        subtotal: subtotal.toFixed(2),
        discount: "0",
        tax: "0",
        total: total.toFixed(2),
        amountPaid: paid.toFixed(2),
        changeAmount: change.toFixed(2),
        status: "completed",
      }).returning();

      for (const orderItem of orderItems) {
        await tx.insert(transactionItems).values({
          transactionId: transaction.id,
          productId: orderItem.product.id,
          quantity: orderItem.quantity,
          price: orderItem.price.toFixed(2),
          subtotal: orderItem.subtotal.toFixed(2),
        });

        await tx.update(products)
          .set({ stock: sql`${products.stock} - ${orderItem.quantity}` })
          .where(eq(products.id, orderItem.product.id));

        await tx.insert(stockMovements).values({
          productId: orderItem.product.id,
          type: "sale",
          quantity: -orderItem.quantity,
          referenceId: transaction.id,
          note: `Sale ${transactionNumber}`,
        });
      }

      const response = {
        transactionId: transaction.id,
        transactionNumber: transaction.number,
        subtotal: parseFloat(transaction.subtotal),
        total: parseFloat(transaction.total),
        paymentMethod: transaction.paymentMethod,
        amountPaid: parseFloat(transaction.amountPaid || "0"),
        changeAmount: parseFloat(transaction.changeAmount || "0"),
        items: orderItems.map((oi) => ({
          productId: oi.product.id,
          name: oi.product.name,
          quantity: oi.quantity,
          price: oi.price,
          subtotal: oi.subtotal,
        })),
        status: transaction.status,
        createdAt: transaction.createdAt,
      };

      if (existing.length === 0) {
        await tx.insert(checkoutIdempotency).values({
          key: idempotencyKey,
          requestHash,
          transactionId: transaction.id,
          response: JSON.stringify(response),
        });
      } else {
        await tx.update(checkoutIdempotency)
          .set({ transactionId: transaction.id, response: JSON.stringify(response) })
          .where(eq(checkoutIdempotency.key, idempotencyKey));
      }

      return response;
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Checkout error:", error.message);
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 400 });
  }
}
