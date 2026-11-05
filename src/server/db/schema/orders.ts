import {
  boolean,
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

import { DEFAULT_BUSINESS_ID, DEFAULT_STORE_ID, transactionsSchema } from "./schema";
import { businesses, stores } from "./core";
import { customers } from "./customers";
import { products, productVariants } from "./products";
import { transactions } from "./transactions";

const s = transactionsSchema;

/** Meja/lokasi QR. Token disimpan sebagai hash; token mentah tidak disimpan. */
export const diningTables = s.table(
  "DiningTables",
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
    tableNumber: text("TableNumber"),
    name: text("Name"),
    qrTokenHash: text("QrTokenHash").notNull(),
    isActive: boolean("IsActive").notNull().default(true),
    createdAt: timestamp("CreatedAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("DiningTables_QrTokenHash_key").on(t.qrTokenHash),
    unique("DiningTables_StoreId_TableNumber_key").on(t.storeId, t.tableNumber),
    index("DiningTables_BusinessId_idx").on(t.businessId),
    index("DiningTables_StoreId_idx").on(t.storeId),
    index("DiningTables_IsActive_idx").on(t.isActive),
  ]
);

/** Sumber kebenaran operasional untuk POS dan QR. */
export const orders = s.table(
  "Orders",
  {
    id: text("Id").primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    storeId: uuid("StoreId")
      .notNull()
      .default(DEFAULT_STORE_ID)
      .references(() => stores.id, { onDelete: "restrict" }),
    orderNumber: text("OrderNumber").notNull(),
    orderSource: text("OrderSource").notNull(),
    orderStatus: text("OrderStatus").notNull().default("SUBMITTED"),
    paymentStatus: text("PaymentStatus").notNull().default("UNPAID"),
    diningTableId: uuid("DiningTableId").references(() => diningTables.id, {
      onDelete: "set null",
    }),
    customerId: text("CustomerId").references(() => customers.id, {
      onDelete: "set null",
    }),
    customerName: text("CustomerName"),
    customerPhone: text("CustomerPhone"),
    cashierId: text("CashierId"),
    cashierName: text("CashierName"),
    orderType: text("OrderType").notNull().default("dine-in"),
    tableNumber: text("TableNumber"),
    paymentMethod: text("PaymentMethod"),
    currency: text("Currency").notNull().default("IDR"),
    subtotal: numeric("Subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
    discountTotal: numeric("DiscountTotal", { precision: 14, scale: 2 }).notNull().default("0"),
    taxTotal: numeric("TaxTotal", { precision: 14, scale: 2 }).notNull().default("0"),
    grandTotal: numeric("GrandTotal", { precision: 14, scale: 2 }).notNull().default("0"),
    amountPaid: numeric("AmountPaid", { precision: 14, scale: 2 }),
    changeAmount: numeric("ChangeAmount", { precision: 14, scale: 2 }),
    idempotencyKey: text("IdempotencyKey"),
    linkedTransactionId: text("LinkedTransactionId").references(() => transactions.id, {
      onDelete: "set null",
    }),
    notes: text("Notes"),
    cancelReason: text("CancelReason"),
    submittedAt: timestamp("SubmittedAt", { withTimezone: true }),
    paidAt: timestamp("PaidAt", { withTimezone: true }),
    completedAt: timestamp("CompletedAt", { withTimezone: true }),
    createdAt: timestamp("CreatedAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("Orders_OrderNumber_key").on(t.orderNumber),
    unique("Orders_IdempotencyKey_key").on(t.idempotencyKey),
    index("Orders_BusinessId_idx").on(t.businessId),
    index("Orders_StoreId_idx").on(t.storeId),
    index("Orders_Status_idx").on(t.orderStatus),
    index("Orders_PaymentStatus_idx").on(t.paymentStatus),
    index("Orders_Source_idx").on(t.orderSource),
    index("Orders_CreatedAt_idx").on(t.createdAt),
    index("Orders_DiningTableId_idx").on(t.diningTableId),
    check("Orders_OrderSource_check", sql`${t.orderSource} in ('POS','QR_TABLE','QR_GENERAL')`),
    check(
      "Orders_OrderStatus_check",
      sql`${t.orderStatus} in ('DRAFT','SUBMITTED','ACCEPTED','PREPARING','READY','COMPLETED','CANCELLED')`
    ),
    check(
      "Orders_PaymentStatus_check",
      sql`${t.paymentStatus} in ('UNPAID','PENDING','PAID','FAILED','EXPIRED','PARTIALLY_REFUNDED','REFUNDED')`
    ),
  ]
);

/** Snapshot item pesanan; riwayat tetap valid jika produk berubah/dinonaktifkan. */
export const orderItems = s.table(
  "OrderItems",
  {
    id: text("Id").primaryKey(),
    orderId: text("OrderId")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("ProductId")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    productVariantId: uuid("ProductVariantId").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    productName: text("ProductName").notNull(),
    sku: text("Sku"),
    variantName: text("VariantName"),
    quantity: integer("Quantity").notNull(),
    unitPrice: numeric("UnitPrice", { precision: 14, scale: 2 }).notNull(),
    discountTotal: numeric("DiscountTotal", { precision: 14, scale: 2 }).notNull().default("0"),
    taxTotal: numeric("TaxTotal", { precision: 14, scale: 2 }).notNull().default("0"),
    subtotal: numeric("Subtotal", { precision: 14, scale: 2 }).notNull(),
    notes: text("Notes"),
    createdAt: timestamp("CreatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("OrderItems_OrderId_idx").on(t.orderId),
    index("OrderItems_ProductId_idx").on(t.productId),
    check("OrderItems_Quantity_check", sql`${t.quantity} > 0`),
  ]
);

export const orderStatusHistory = s.table(
  "OrderStatusHistory",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    orderId: text("OrderId")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromOrderStatus: text("FromOrderStatus"),
    toOrderStatus: text("ToOrderStatus").notNull(),
    fromPaymentStatus: text("FromPaymentStatus"),
    toPaymentStatus: text("ToPaymentStatus"),
    changedByUserId: text("ChangedByUserId"),
    changedByRole: text("ChangedByRole"),
    reason: text("Reason"),
    createdAt: timestamp("CreatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("OrderStatusHistory_OrderId_idx").on(t.orderId),
    index("OrderStatusHistory_CreatedAt_idx").on(t.createdAt),
  ]
);

export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
