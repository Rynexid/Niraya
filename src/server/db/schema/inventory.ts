import {
  check,
  index,
  integer,
  numeric,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { DEFAULT_BUSINESS_ID, DEFAULT_STORE_ID, nirayaSchema } from "./schema";
import { businesses, stores } from "./core";
import { products } from "./products";
import { staff } from "./staff";

const niraya = nirayaSchema;

/**
 * Stok per produk per toko. Tabel ini adalah sumber kebenaran untuk stok
 * multi-outlet. `Products.StockQuantity` dipertahankan sebagai cache toko
 * default agar kompatibel dengan alur POS lama.
 */
export const inventory = niraya.table(
  "Inventory",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    storeId: uuid("StoreId")
      .notNull()
      .default(DEFAULT_STORE_ID)
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: text("ProductId")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    stockQuantity: integer("StockQuantity").notNull().default(0),
    reservedQuantity: integer("ReservedQuantity").notNull().default(0),
    minimumStock: integer("MinimumStock").notNull().default(0),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("Inventory_ProductId_StoreId_key").on(t.productId, t.storeId),
    index("Inventory_BusinessId_idx").on(t.businessId),
    index("Inventory_StoreId_idx").on(t.storeId),
    index("Inventory_ProductId_idx").on(t.productId),
    check("Inventory_StockQuantity_check", sql`${t.stockQuantity} >= 0`),
    check("Inventory_ReservedQuantity_check", sql`${t.reservedQuantity} >= 0`),
    check("Inventory_MinimumStock_check", sql`${t.minimumStock} >= 0`),
  ]
);

/** Ledger setiap perubahan stok. Tidak boleh dihapus saat produk diarsipkan. */
export const stockMovements = niraya.table(
  "StockMovements",
  {
    id: text("Id").primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    storeId: uuid("StoreId")
      .notNull()
      .default(DEFAULT_STORE_ID)
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: text("ProductId").references(() => products.id, {
      onDelete: "set null",
    }),
    productName: text("ProductName").notNull(),
    movementType: text("MovementType").notNull(),
    quantity: integer("Quantity").notNull(),
    stockAfter: integer("StockAfter").notNull(),
    unitCost: numeric("UnitCost", { precision: 14, scale: 2 }),
    note: text("Note"),
    staffId: text("StaffId").references(() => staff.id, {
      onDelete: "set null",
    }),
    staffName: text("StaffName"),
    referenceType: text("ReferenceType"),
    referenceId: text("ReferenceId"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("StockMovements_BusinessId_idx").on(t.businessId),
    index("StockMovements_StoreId_idx").on(t.storeId),
    index("StockMovements_ProductId_idx").on(t.productId),
    index("StockMovements_CreatedAt_idx").on(t.createdAt),
    index("StockMovements_ReferenceId_idx").on(t.referenceId),
    check("StockMovements_StockAfter_check", sql`${t.stockAfter} >= 0`),
    check(
      "StockMovements_MovementType_check",
      sql`${t.movementType} in ('in', 'out', 'adjustment', 'sale', 'void', 'return', 'purchase', 'transfer')`
    ),
  ]
);

/** Audit manual stock adjustment dengan alasan. */
export const stockAdjustments = niraya.table(
  "StockAdjustments",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    storeId: uuid("StoreId")
      .notNull()
      .default(DEFAULT_STORE_ID)
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: text("ProductId")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    adjustmentType: text("AdjustmentType").notNull(),
    quantity: integer("Quantity").notNull(),
    reason: text("Reason").notNull(),
    notes: text("Notes"),
    adjustedByUserId: text("AdjustedByUserId"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("StockAdjustments_BusinessId_idx").on(t.businessId),
    index("StockAdjustments_StoreId_idx").on(t.storeId),
    index("StockAdjustments_ProductId_idx").on(t.productId),
    index("StockAdjustments_CreatedAt_idx").on(t.createdAt),
    check("StockAdjustments_Quantity_check", sql`${t.quantity} >= 0`),
    check(
      "StockAdjustments_AdjustmentType_check",
      sql`${t.adjustmentType} in ('increase', 'decrease', 'set')`
    ),
  ]
);
