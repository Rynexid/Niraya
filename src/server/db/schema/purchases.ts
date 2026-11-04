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

import { DEFAULT_BUSINESS_ID, nirayaSchema } from "./schema";
import { businesses, stores } from "./core";
import { products } from "./products";
import { suppliers } from "./suppliers";

const niraya = nirayaSchema;

/** Purchase order ke supplier. */
export const purchaseOrders = niraya.table(
  "PurchaseOrders",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    storeId: uuid("StoreId")
      .notNull()
      .references(() => stores.id, { onDelete: "restrict" }),
    supplierId: uuid("SupplierId")
      .notNull()
      .references(() => suppliers.id, { onDelete: "restrict" }),
    orderNumber: text("OrderNumber").notNull(),
    status: text("Status").notNull().default("draft"),
    orderDate: timestamp("OrderDate", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expectedDate: timestamp("ExpectedDate", { withTimezone: true }),
    subtotal: numeric("Subtotal", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    taxTotal: numeric("TaxTotal", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    grandTotal: numeric("GrandTotal", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    notes: text("Notes"),
    createdByUserId: text("CreatedByUserId"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("PurchaseOrders_OrderNumber_key").on(t.orderNumber),
    index("PurchaseOrders_BusinessId_idx").on(t.businessId),
    index("PurchaseOrders_StoreId_idx").on(t.storeId),
    index("PurchaseOrders_SupplierId_idx").on(t.supplierId),
    index("PurchaseOrders_Status_idx").on(t.status),
    index("PurchaseOrders_OrderDate_idx").on(t.orderDate),
    check(
      "PurchaseOrders_Status_check",
      sql`${t.status} in ('draft', 'ordered', 'partial', 'received', 'cancelled')`
    ),
    check("PurchaseOrders_Subtotal_check", sql`${t.subtotal} >= 0`),
    check("PurchaseOrders_TaxTotal_check", sql`${t.taxTotal} >= 0`),
    check("PurchaseOrders_GrandTotal_check", sql`${t.grandTotal} >= 0`),
  ]
);

/** Baris purchase order. */
export const purchaseOrderItems = niraya.table(
  "PurchaseOrderItems",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    purchaseOrderId: uuid("PurchaseOrderId")
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: "cascade" }),
    productId: text("ProductId")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    productName: text("ProductName").notNull(),
    sku: text("Sku"),
    quantityOrdered: integer("QuantityOrdered").notNull(),
    quantityReceived: integer("QuantityReceived").notNull().default(0),
    unitCost: numeric("UnitCost", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    lineTotal: numeric("LineTotal", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("PurchaseOrderItems_PurchaseOrderId_idx").on(t.purchaseOrderId),
    index("PurchaseOrderItems_ProductId_idx").on(t.productId),
    check(
      "PurchaseOrderItems_QuantityOrdered_check",
      sql`${t.quantityOrdered} > 0`
    ),
    check(
      "PurchaseOrderItems_QuantityReceived_check",
      sql`${t.quantityReceived} >= 0`
    ),
    check("PurchaseOrderItems_UnitCost_check", sql`${t.unitCost} >= 0`),
    check("PurchaseOrderItems_LineTotal_check", sql`${t.lineTotal} >= 0`),
  ]
);

/** Penerimaan barang atas purchase order. */
export const goodsReceipts = niraya.table(
  "GoodsReceipts",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    purchaseOrderId: uuid("PurchaseOrderId")
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: "restrict" }),
    receiptNumber: text("ReceiptNumber").notNull(),
    receivedByUserId: text("ReceivedByUserId"),
    receivedAt: timestamp("ReceivedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    notes: text("Notes"),
    status: text("Status").notNull().default("received"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("GoodsReceipts_ReceiptNumber_key").on(t.receiptNumber),
    index("GoodsReceipts_PurchaseOrderId_idx").on(t.purchaseOrderId),
    index("GoodsReceipts_ReceivedAt_idx").on(t.receivedAt),
    check(
      "GoodsReceipts_Status_check",
      sql`${t.status} in ('draft', 'received', 'voided')`
    ),
  ]
);

/** Baris penerimaan barang; menghubungkan qty diterima ke item PO. */
export const goodsReceiptItems = niraya.table(
  "GoodsReceiptItems",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    goodsReceiptId: uuid("GoodsReceiptId")
      .notNull()
      .references(() => goodsReceipts.id, { onDelete: "cascade" }),
    purchaseOrderItemId: uuid("PurchaseOrderItemId")
      .notNull()
      .references(() => purchaseOrderItems.id, { onDelete: "restrict" }),
    productId: text("ProductId")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantityReceived: integer("QuantityReceived").notNull(),
    unitCost: numeric("UnitCost", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("GoodsReceiptItems_GoodsReceiptId_idx").on(t.goodsReceiptId),
    index("GoodsReceiptItems_PurchaseOrderItemId_idx").on(
      t.purchaseOrderItemId
    ),
    index("GoodsReceiptItems_ProductId_idx").on(t.productId),
    check(
      "GoodsReceiptItems_QuantityReceived_check",
      sql`${t.quantityReceived} > 0`
    ),
    check("GoodsReceiptItems_UnitCost_check", sql`${t.unitCost} >= 0`),
  ]
);
