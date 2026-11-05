import {
  check,
  index,
  integer,
  jsonb,
  numeric,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { paymentsSchema } from "./schema";
import { products } from "./products";
import { paymentMethods, discounts } from "./lookups";
import { orders } from "./orders";
import { transactionItems, transactions } from "./transactions";

const s = paymentsSchema;

/** Pembayaran untuk transaksi; mendukung pembayaran bertahap dan order unified. */
export const payments = s.table(
  "Payments",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    transactionId: text("TransactionId")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    orderId: text("OrderId").references(() => orders.id, { onDelete: "set null" }),
    channel: text("Channel"),
    currency: text("Currency").notNull().default("IDR"),
    paymentMethod: text("PaymentMethod")
      .notNull()
      .references(() => paymentMethods.code, { onDelete: "restrict" }),
    amount: numeric("Amount", { precision: 14, scale: 2 }).notNull(),
    referenceNumber: text("ReferenceNumber"),
    provider: text("Provider"),
    providerReference: text("ProviderReference"),
    proofUrl: text("ProofUrl"),
    proofSubmittedAt: timestamp("ProofSubmittedAt", { withTimezone: true }),
    verifiedByUserId: text("VerifiedByUserId"),
    verifiedAt: timestamp("VerifiedAt", { withTimezone: true }),
    verificationNote: text("VerificationNote"),
    expiresAt: timestamp("ExpiresAt", { withTimezone: true }),
    metadata: jsonb("Metadata"),
    status: text("Status").notNull().default("completed"),
    paidAt: timestamp("PaidAt", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("Payments_TransactionId_idx").on(t.transactionId),
    index("Payments_OrderId_idx").on(t.orderId),
    index("Payments_PaymentMethod_idx").on(t.paymentMethod),
    index("Payments_PaidAt_idx").on(t.paidAt),
    check("Payments_Amount_check", sql`${t.amount} >= 0`),
    check(
      "Payments_Status_check",
      sql`${t.status} in ('pending', 'completed', 'failed', 'refunded', 'WAITING_PROOF', 'PENDING_VERIFICATION', 'PENDING_GATEWAY', 'PAID', 'REJECTED', 'EXPIRED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED')`,
    ),
  ],
);

/** Detail diskon per transaksi. */
export const transactionDiscounts = s.table(
  "TransactionDiscounts",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    transactionId: text("TransactionId")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    discountId: uuid("DiscountId").references(() => discounts.id, {
      onDelete: "set null",
    }),
    name: text("Name").notNull(),
    type: text("Type").notNull().default("fixed"),
    value: numeric("Value", { precision: 14, scale: 2 }).notNull().default("0"),
    amount: numeric("Amount", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("TransactionDiscounts_TransactionId_idx").on(t.transactionId),
    index("TransactionDiscounts_DiscountId_idx").on(t.discountId),
    check(
      "TransactionDiscounts_Type_check",
      sql`${t.type} in ('percentage', 'fixed')`,
    ),
    check("TransactionDiscounts_Value_check", sql`${t.value} >= 0`),
    check("TransactionDiscounts_Amount_check", sql`${t.amount} >= 0`),
  ],
);

/** Header refund; transaksi asli tidak dihapus. */
export const transactionRefunds = s.table(
  "TransactionRefunds",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    transactionId: text("TransactionId")
      .notNull()
      .references(() => transactions.id, { onDelete: "restrict" }),
    refundNumber: text("RefundNumber").notNull(),
    amount: numeric("Amount", { precision: 14, scale: 2 }).notNull(),
    reason: text("Reason").notNull(),
    status: text("Status").notNull().default("completed"),
    refundedByUserId: text("RefundedByUserId"),
    refundedAt: timestamp("RefundedAt", { withTimezone: true }),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("TransactionRefunds_RefundNumber_key").on(t.refundNumber),
    index("TransactionRefunds_TransactionId_idx").on(t.transactionId),
    index("TransactionRefunds_Status_idx").on(t.status),
    check("TransactionRefunds_Amount_check", sql`${t.amount} >= 0`),
    check(
      "TransactionRefunds_Status_check",
      sql`${t.status} in ('pending', 'completed', 'rejected')`,
    ),
  ],
);

/** Baris refund; merujuk item transaksi asli. */
export const transactionRefundItems = s.table(
  "TransactionRefundItems",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    refundId: uuid("RefundId")
      .notNull()
      .references(() => transactionRefunds.id, { onDelete: "cascade" }),
    transactionItemId: text("TransactionItemId")
      .notNull()
      .references(() => transactionItems.id, { onDelete: "restrict" }),
    productId: text("ProductId")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: integer("Quantity").notNull(),
    unitPrice: numeric("UnitPrice", { precision: 14, scale: 2 }).notNull(),
    lineTotal: numeric("LineTotal", { precision: 14, scale: 2 }).notNull(),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("TransactionRefundItems_RefundId_idx").on(t.refundId),
    index("TransactionRefundItems_TransactionItemId_idx").on(
      t.transactionItemId,
    ),
    index("TransactionRefundItems_ProductId_idx").on(t.productId),
    check("TransactionRefundItems_Quantity_check", sql`${t.quantity} > 0`),
    check("TransactionRefundItems_UnitPrice_check", sql`${t.unitPrice} >= 0`),
    check("TransactionRefundItems_LineTotal_check", sql`${t.lineTotal} >= 0`),
  ],
);
