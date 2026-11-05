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

import { DEFAULT_BUSINESS_ID, DEFAULT_STORE_ID, transactionsSchema } from "./schema";
import { businesses, stores } from "./core";
import { customers } from "./customers";
import { staff } from "./staff";
import { products, productVariants } from "./products";
import { paymentMethods, taxRates } from "./lookups";

const s = transactionsSchema;

/** Header transaksi penjualan. */
export const transactions = s.table(
  "Transactions",
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
    transactionNumber: text("TransactionNumber").notNull(),
    cashierId: text("CashierId"),
    cashierName: text("CashierName"),
    staffId: text("StaffId").references(() => staff.id, {
      onDelete: "set null",
    }),
    customerId: text("CustomerId").references(() => customers.id, {
      onDelete: "set null",
    }),
    customerName: text("CustomerName"),
    orderType: text("OrderType").notNull().default("dine-in"),
    tableNumber: text("TableNumber"),
    paymentMethod: text("PaymentMethod")
      .notNull()
      .references(() => paymentMethods.code, { onDelete: "restrict" }),
    paymentStatus: text("PaymentStatus").notNull().default("paid"),
    taxRateId: uuid("TaxRateId").references(() => taxRates.id, {
      onDelete: "set null",
    }),
    subtotal: numeric("Subtotal", { precision: 14, scale: 2 }).notNull(),
    discountTotal: numeric("DiscountTotal", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    taxTotal: numeric("TaxTotal", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    grandTotal: numeric("GrandTotal", { precision: 14, scale: 2 }).notNull(),
    amountPaid: numeric("AmountPaid", { precision: 14, scale: 2 }),
    changeAmount: numeric("ChangeAmount", { precision: 14, scale: 2 }),
    status: text("Status").notNull().default("completed"),
    voidReason: text("VoidReason"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("Transactions_TransactionNumber_key").on(t.transactionNumber),
    index("Transactions_BusinessId_idx").on(t.businessId),
    index("Transactions_StoreId_idx").on(t.storeId),
    index("Transactions_CustomerId_idx").on(t.customerId),
    index("Transactions_StaffId_idx").on(t.staffId),
    index("Transactions_CreatedAt_idx").on(t.createdAt),
    index("Transactions_Status_idx").on(t.status),
    index("Transactions_PaymentMethod_idx").on(t.paymentMethod),
    check(
      "Transactions_OrderType_check",
      sql`${t.orderType} in ('dine-in', 'takeaway', 'delivery')`
    ),
    check(
      "Transactions_Status_check",
      sql`${t.status} in ('completed', 'voided', 'refunded')`
    ),
    check(
      "Transactions_PaymentStatus_check",
      sql`${t.paymentStatus} in ('unpaid', 'partial', 'paid', 'refunded', 'voided')`
    ),
    check("Transactions_Subtotal_check", sql`${t.subtotal} >= 0`),
    check("Transactions_DiscountTotal_check", sql`${t.discountTotal} >= 0`),
    check("Transactions_TaxTotal_check", sql`${t.taxTotal} >= 0`),
    check("Transactions_GrandTotal_check", sql`${t.grandTotal} >= 0`),
    check(
      "Transactions_AmountPaid_check",
      sql`${t.amountPaid} is null or ${t.amountPaid} >= 0`
    ),
    check(
      "Transactions_ChangeAmount_check",
      sql`${t.changeAmount} is null or ${t.changeAmount} >= 0`
    ),
  ]
);

/** Baris transaksi; menyimpan snapshot nama, SKU, dan harga saat transaksi. */
export const transactionItems = s.table(
  "TransactionItems",
  {
    id: text("Id").primaryKey(),
    transactionId: text("TransactionId")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    productId: text("ProductId")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    productVariantId: uuid("ProductVariantId").references(
      () => productVariants.id,
      { onDelete: "set null" }
    ),
    productName: text("ProductName").notNull(),
    sku: text("Sku"),
    quantity: integer("Quantity").notNull(),
    unitPrice: numeric("UnitPrice", { precision: 14, scale: 2 }).notNull(),
    discountTotal: numeric("DiscountTotal", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    taxTotal: numeric("TaxTotal", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    lineTotal: numeric("LineTotal", { precision: 14, scale: 2 }).notNull(),
    costPrice: numeric("CostPrice", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    notes: text("Notes"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("TransactionItems_TransactionId_idx").on(t.transactionId),
    index("TransactionItems_ProductId_idx").on(t.productId),
    index("TransactionItems_ProductVariantId_idx").on(t.productVariantId),
    check("TransactionItems_Quantity_check", sql`${t.quantity} > 0`),
    check("TransactionItems_UnitPrice_check", sql`${t.unitPrice} >= 0`),
    check("TransactionItems_DiscountTotal_check", sql`${t.discountTotal} >= 0`),
    check("TransactionItems_TaxTotal_check", sql`${t.taxTotal} >= 0`),
    check("TransactionItems_LineTotal_check", sql`${t.lineTotal} >= 0`),
    check("TransactionItems_CostPrice_check", sql`${t.costPrice} >= 0`),
  ]
);

import { orders } from "./orders";

/** Idempotency key untuk checkout POS. */
export const checkoutIdempotency = s.table(
  "CheckoutIdempotency",
  {
    key: text("Key").primaryKey(),
    requestHash: text("RequestHash").notNull(),
    transactionId: text("TransactionId").references(() => transactions.id, {
      onDelete: "set null",
    }),
    orderId: text("OrderId").references(() => orders.id, {
      onDelete: "set null",
    }),
    scope: text("Scope"),
    response: text("Response"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("ExpiresAt", { withTimezone: true }),
  },
  (t) => [
    index("CheckoutIdempotency_TransactionId_idx").on(t.transactionId),
    index("CheckoutIdempotency_OrderId_idx").on(t.orderId),
    index("CheckoutIdempotency_ExpiresAt_idx").on(t.expiresAt),
  ]
);
