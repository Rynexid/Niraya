import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { db } from "@/server/db";
import { executePosCheckout } from "@/server/pos/checkout-core";

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
  paymentMethod: z.enum(["cash", "card", "qris", "manual_transfer"]),
  paymentAmount: z.number().positive().optional(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  orderType: z.enum(["dine-in", "takeaway"]).default("dine-in"),
  tableNumber: z.string().optional(),
  discount: z.number().min(0).default(0),
  // Diterima untuk kompatibilitas klien lama; nilai final dihitung server.
  tax: z.number().min(0).optional(),
  cashier: z.string().optional(),
});

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
    const response = await executePosCheckout(db, payload, {
      id: String(user.id),
      name: user.name ?? null,
    });
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Checkout error:", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || "Checkout gagal." },
      { status: error?.status ?? 400 }
    );
  }
}
