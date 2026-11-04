import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";

import { BUSINESS_SETTINGS } from "@/lib/business-seed";
import type {
  BusinessSettings,
  Category,
  Customer,
  EntityStatus,
  Product,
  Staff,
  StockMovement,
  Transaction,
  TransactionItem,
} from "@/types/business";
import { db } from "@/server/db";
import {
  categories,
  customers,
  products,
  settings,
  staff,
  stockMovements,
  transactionItems,
  transactions,
} from "@/server/db/schema";

const money = (value: number) => value.toFixed(2);
const number = (value: string | null | undefined) => Number(value ?? 0);
const iso = (value: Date | string) => new Date(value).toISOString();

export type BusinessData = {
  categories: Category[];
  products: Product[];
  customers: Customer[];
  staff: Staff[];
  transactions: Transaction[];
  movements: StockMovement[];
  settings: BusinessSettings;
};

export type BusinessQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  status?: string;
  stockFilter?: string;
  payment?: string;
  from?: string;
  to?: string;
};

export type ActingUser = {
  actingUserId?: string;
  actingUserRole?: string;
};

export async function getBusinessData(query: BusinessQuery = {}): Promise<BusinessData> {
  const {
    page = 1,
    pageSize = 20,
    search,
    categoryId,
    status,
    stockFilter: _stockFilter,
    payment,
    from,
    to,
  } = query;

  const offset = (page - 1) * pageSize;

  const transactionFilters: any[] = [];
  if (search) {
    transactionFilters.push(
      or(
        ilike(transactions.number, `%${search}%`),
        ilike(transactions.customerName, `%${search}%`),
        ilike(transactions.cashierName, `%${search}%`)
      )
    );
  }
  if (status) transactionFilters.push(eq(transactions.status, status));
  if (payment) transactionFilters.push(eq(transactions.paymentMethod, payment));
  if (from) transactionFilters.push(gte(transactions.createdAt, new Date(from)));
  if (to) transactionFilters.push(lte(transactions.createdAt, new Date(to)));

  const productFilters: any[] = [];
  if (search) {
    productFilters.push(
      or(
        ilike(products.name, `%${search}%`),
        ilike(products.sku, `%${search}%`),
        ilike(products.barcode ?? "", `%${search}%`)
      )
    );
  }
  if (categoryId) productFilters.push(eq(products.categoryId, categoryId));
  if (status) productFilters.push(eq(products.status, status));

  const customerFilters: any[] = [];
  if (search) {
    customerFilters.push(
      or(
        ilike(customers.name, `%${search}%`),
        ilike(customers.phone, `%${search}%`),
        ilike(customers.email, `%${search}%`)
      )
    );
  }

  const staffFilters: any[] = [];
  if (search) {
    staffFilters.push(
      or(
        ilike(staff.name, `%${search}%`),
        ilike(staff.email, `%${search}%`)
      )
    );
  }
  if (status) staffFilters.push(eq(staff.status, status));

  const [
    categoryRows,
    productRows,
    customerRows,
    staffRows,
    settingsRows,
    transactionRows,
    itemRows,
    movementRows,
  ] = await Promise.all([
    db.select().from(categories),
    db
      .select()
      .from(products)
      .where(and(...productFilters))
      .limit(pageSize)
      .offset(offset),
    db
      .select()
      .from(customers)
      .where(and(...customerFilters))
      .limit(pageSize)
      .offset(offset),
    db
      .select()
      .from(staff)
      .where(and(...staffFilters))
      .limit(pageSize)
      .offset(offset),
    db.select().from(settings).where(eq(settings.id, "default")),
    db
      .select()
      .from(transactions)
      .where(and(...transactionFilters))
      .orderBy(desc(transactions.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select().from(transactionItems),
    db.select().from(stockMovements),
  ]);

  const itemsByTransaction = new Map<string, TransactionItem[]>();
  for (const item of itemRows) {
    const list = itemsByTransaction.get(item.transactionId) ?? [];
    list.push({
      productId: item.productId,
      name: item.name,
      sku: item.sku ?? "",
      quantity: item.quantity,
      unitPrice: number(item.unitPrice),
      lineTotal: number(item.lineTotal),
    });
    itemsByTransaction.set(item.transactionId, list);
  }

  const mappedTransactions: Transaction[] = transactionRows
    .map((row) => ({
      id: row.id,
      number: row.number,
      createdAt: iso(row.createdAt),
      cashier: row.cashierName ?? "Kasir",
      customerId: row.customerId ?? undefined,
      customerName: row.customerName ?? "Umum",
      orderType:
        row.orderType === "takeaway"
          ? ("takeaway" as const)
          : ("dine-in" as const),
      tableNumber: row.tableNumber ?? undefined,
      items: itemsByTransaction.get(row.id) ?? [],
      subtotal: number(row.subtotal),
      discount: number(row.discount),
      tax: number(row.tax),
      total: number(row.total),
      paymentMethod: row.paymentMethod as Transaction["paymentMethod"],
      cashReceived: row.amountPaid ? number(row.amountPaid) : undefined,
      change: row.changeAmount ? number(row.changeAmount) : undefined,
      status: row.status as Transaction["status"],
      voidReason: row.voidReason ?? undefined,
    }))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const settingsRow = settingsRows[0];
  const mappedSettings: BusinessSettings = settingsRow
    ? {
        businessName: settingsRow.businessName,
        address: settingsRow.address,
        phone: settingsRow.phone,
        email: settingsRow.email,
        currency: settingsRow.currency,
        timezone: settingsRow.timezone,
        taxRate: number(settingsRow.taxRate),
        memberDiscountRate: number(settingsRow.memberDiscountRate),
        lowStockThreshold: settingsRow.lowStockThreshold,
        receiptFooter: settingsRow.receiptFooter,
      }
    : BUSINESS_SETTINGS;

  return {
    categories: categoryRows
      .map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? undefined,
        status: row.status as EntityStatus,
        createdAt: iso(row.createdAt),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    products: productRows
      .map((row) => ({
        id: row.id,
        name: row.name,
        sku: row.sku,
        barcode: row.barcode ?? undefined,
        categoryId: row.categoryId ?? "",
        price: number(row.price),
        cost: number(row.cost),
        stock: row.stock,
        minStock: row.minStock,
        unit: row.unit,
        imageUrl: row.imageUrl ?? undefined,
        status: row.status as EntityStatus,
        createdAt: iso(row.createdAt),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    customers: customerRows
      .map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email ?? undefined,
        notes: row.notes ?? undefined,
        joinedAt: iso(row.joinedAt),
      }))
      .sort(
        (a, b) =>
          new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
      ),
    staff: staffRows
      .map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role as Staff["role"],
        status: row.status as Staff["status"],
        joinedAt: iso(row.joinedAt),
        lastActive: row.lastActive ? iso(row.lastActive) : undefined,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    transactions: mappedTransactions,
    movements: movementRows
      .map((row) => ({
        id: row.id,
        productId: row.productId,
        productName: row.productName,
        type: row.type as StockMovement["type"],
        quantity: row.quantity,
        stockAfter: row.stockAfter,
        note: row.note ?? "",
        staff: row.staff ?? "Kasir",
        createdAt: iso(row.createdAt),
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    settings: mappedSettings,
  };
}

function requiredId(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} tidak valid.`);
  }
  return value;
}

export async function mutateBusiness(
  action: string,
  payload: any,
  actingUser: ActingUser = {}
) {
  const { actingUserId: _actingUserId, actingUserRole: _actingUserRole } = actingUser;
  switch (action) {
    case "category.create": {
      await db.insert(categories).values({
        id: requiredId(payload.id, "ID kategori"),
        name: String(payload.name ?? "").trim(),
        description: payload.description?.trim() || null,
        status: payload.status ?? "active",
        createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
      });
      return { ok: true };
    }

    case "category.update": {
      await db
        .update(categories)
        .set({
          name: String(payload.name ?? "").trim(),
          description: payload.description?.trim() || null,
          status: payload.status ?? "active",
        })
        .where(eq(categories.id, requiredId(payload.id, "ID kategori")));
      return { ok: true };
    }

    case "category.delete": {
      const id = requiredId(payload.id, "ID kategori");
      const used = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.categoryId, id))
        .limit(1);
      if (used.length > 0) {
        throw new Error("Kategori masih dipakai produk. Pindahkan produk dulu.");
      }
      await db.delete(categories).where(eq(categories.id, id));
      return { ok: true };
    }

    case "product.create": {
      await db.insert(products).values({
        id: requiredId(payload.id, "ID produk"),
        name: String(payload.name ?? "").trim(),
        sku: String(payload.sku ?? "").trim().toUpperCase(),
        barcode: payload.barcode?.trim() || null,
        categoryId: payload.categoryId || null,
        price: money(Number(payload.price ?? 0)),
        cost: money(Number(payload.cost ?? 0)),
        stock: Number(payload.stock ?? 0),
        minStock: Number(payload.minStock ?? 0),
        unit: String(payload.unit ?? "pcs").trim() || "pcs",
        imageUrl: payload.imageUrl?.trim() || null,
        status: payload.status ?? "active",
        createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
        updatedAt: new Date(),
      });
      return { ok: true };
    }

    case "product.update": {
      await db
        .update(products)
        .set({
          name: String(payload.name ?? "").trim(),
          sku: String(payload.sku ?? "").trim().toUpperCase(),
          barcode: payload.barcode?.trim() || null,
          categoryId: payload.categoryId || null,
          price: money(Number(payload.price ?? 0)),
          cost: money(Number(payload.cost ?? 0)),
          stock: Number(payload.stock ?? 0),
          minStock: Number(payload.minStock ?? 0),
          unit: String(payload.unit ?? "pcs").trim() || "pcs",
          imageUrl: payload.imageUrl?.trim() || null,
          status: payload.status ?? "active",
          updatedAt: new Date(),
        })
        .where(eq(products.id, requiredId(payload.id, "ID produk")));
      return { ok: true };
    }

    case "product.status": {
      await db
        .update(products)
        .set({ status: payload.status, updatedAt: new Date() })
        .where(eq(products.id, requiredId(payload.id, "ID produk")));
      return { ok: true };
    }

    case "product.delete": {
      const id = requiredId(payload.id, "ID produk");
      const used = await db
        .select({ id: transactionItems.id })
        .from(transactionItems)
        .where(eq(transactionItems.productId, id))
        .limit(1);
      if (used.length > 0) {
        throw new Error(
          "Produk sudah dipakai transaksi. Arsipkan saja agar riwayat tetap utuh."
        );
      }
      await db.delete(products).where(eq(products.id, id));
      return { ok: true };
    }

    case "customer.create": {
      await db.insert(customers).values({
        id: requiredId(payload.id, "ID pelanggan"),
        name: String(payload.name ?? "").trim(),
        phone: String(payload.phone ?? "").trim(),
        email: payload.email?.trim() || null,
        notes: payload.notes?.trim() || null,
        joinedAt: payload.joinedAt ? new Date(payload.joinedAt) : new Date(),
      });
      return { ok: true };
    }

    case "customer.update": {
      await db
        .update(customers)
        .set({
          name: String(payload.name ?? "").trim(),
          phone: String(payload.phone ?? "").trim(),
          email: payload.email?.trim() || null,
          notes: payload.notes?.trim() || null,
        })
        .where(eq(customers.id, requiredId(payload.id, "ID pelanggan")));
      return { ok: true };
    }

    case "customer.delete": {
      await db
        .delete(customers)
        .where(eq(customers.id, requiredId(payload.id, "ID pelanggan")));
      return { ok: true };
    }

    case "staff.create": {
      await db.insert(staff).values({
        id: requiredId(payload.id, "ID staf"),
        name: String(payload.name ?? "").trim(),
        email: String(payload.email ?? "").trim().toLowerCase(),
        role: payload.role ?? "cashier",
        status: payload.status ?? "active",
        joinedAt: payload.joinedAt ? new Date(payload.joinedAt) : new Date(),
        lastActive: new Date(),
      });
      return { ok: true };
    }

    case "staff.update": {
      await db
        .update(staff)
        .set({
          name: String(payload.name ?? "").trim(),
          email: String(payload.email ?? "").trim().toLowerCase(),
          role: payload.role ?? "cashier",
          status: payload.status ?? "active",
        })
        .where(eq(staff.id, requiredId(payload.id, "ID staf")));
      return { ok: true };
    }

    case "staff.delete": {
      const id = requiredId(payload.id, "ID staf");
      const [member] = await db
        .select()
        .from(staff)
        .where(eq(staff.id, id))
        .limit(1);
      if (member?.role === "owner") {
        throw new Error("Akun owner tidak bisa dihapus.");
      }
      await db.delete(staff).where(eq(staff.id, id));
      return { ok: true };
    }

    case "stock.adjust": {
      const productId = requiredId(payload.productId, "ID produk");
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);
      if (!product) throw new Error("Produk tidak ditemukan.");

      const quantity = Number(payload.quantity ?? 0);
      if (!Number.isFinite(quantity) || quantity < 0) {
        throw new Error("Jumlah stok tidak valid.");
      }

      const mode = payload.mode as "in" | "out" | "adjustment";
      const delta =
        mode === "in" ? quantity : mode === "out" ? -quantity : quantity - product.stock;
      const nextStock = product.stock + delta;
      if (nextStock < 0) throw new Error("Stok tidak boleh negatif.");

      await db.transaction(async (tx) => {
        await tx
          .update(products)
          .set({ stock: nextStock, updatedAt: new Date() })
          .where(eq(products.id, productId));

        await tx.insert(stockMovements).values({
          id: payload.movementId ?? crypto.randomUUID(),
          productId,
          productName: product.name,
          type: mode,
          quantity: delta,
          stockAfter: nextStock,
          note: String(payload.note ?? "").trim() || "Penyesuaian stok",
          staff: String(payload.staff ?? "").trim() || "Kasir",
          createdAt: new Date(),
        });
      });

      return { ok: true };
    }

    case "transaction.void": {
      const id = requiredId(payload.id, "ID transaksi");
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .limit(1);
      if (!transaction) throw new Error("Transaksi tidak ditemukan.");
      if (transaction.status !== "completed") {
        throw new Error("Hanya transaksi selesai yang bisa dibatalkan.");
      }

      const items = await db
        .select()
        .from(transactionItems)
        .where(eq(transactionItems.transactionId, id));

      await db.transaction(async (tx) => {
        for (const item of items) {
          const [product] = await tx
            .select()
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);
          if (!product) continue;

          const nextStock = product.stock + item.quantity;
          await tx
            .update(products)
            .set({ stock: nextStock, updatedAt: new Date() })
            .where(eq(products.id, product.id));

          await tx.insert(stockMovements).values({
            id: crypto.randomUUID(),
            productId: product.id,
            productName: product.name,
            type: "void",
            quantity: item.quantity,
            stockAfter: nextStock,
            note: `Pembatalan ${transaction.number}`,
            staff: transaction.cashierName ?? "Kasir",
            referenceId: transaction.id,
            createdAt: new Date(),
          });
        }

        await tx
          .update(transactions)
          .set({
            status: "voided",
            voidReason: String(payload.reason ?? "").trim() || "Dibatalkan",
          })
          .where(eq(transactions.id, id));
      });

      return { ok: true };
    }

    case "settings.update": {
      const patch = payload as Partial<BusinessSettings>;
      const existing = await db
        .select()
        .from(settings)
        .where(eq(settings.id, "default"))
        .limit(1);

      const current = existing[0];
      const values = {
        businessName:
          patch.businessName ??
          current?.businessName ??
          BUSINESS_SETTINGS.businessName,
        address: patch.address ?? current?.address ?? "",
        phone: patch.phone ?? current?.phone ?? "",
        email: patch.email ?? current?.email ?? "",
        currency: patch.currency ?? current?.currency ?? "IDR",
        timezone: patch.timezone ?? current?.timezone ?? "Asia/Jakarta",
        taxRate: String(patch.taxRate ?? current?.taxRate ?? 0),
        memberDiscountRate: String(
          patch.memberDiscountRate ?? current?.memberDiscountRate ?? 0
        ),
        lowStockThreshold:
          patch.lowStockThreshold ?? current?.lowStockThreshold ?? 10,
        receiptFooter:
          patch.receiptFooter ?? current?.receiptFooter ?? "",
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        await db
          .update(settings)
          .set(values)
          .where(eq(settings.id, "default"));
      } else {
        await db.insert(settings).values({ id: "default", ...values });
      }
      return { ok: true };
    }

    default:
      throw new Error(`Aksi tidak dikenal: ${action}`);
  }
}
