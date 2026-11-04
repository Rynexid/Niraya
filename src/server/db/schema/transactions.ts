import {
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  number: text("number").notNull().unique(),
  cashierId: text("cashier_id"),
  cashierName: text("cashier_name"),
  customerId: text("customer_id"),
  customerName: text("customer_name"),
  orderType: text("order_type").notNull().default("dine-in"),
  tableNumber: text("table_number"),
  paymentMethod: text("payment_method").notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
  tax: numeric("tax", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }),
  changeAmount: numeric("change_amount", { precision: 12, scale: 2 }),
  status: text("status").notNull().default("completed"),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const transactionItems = pgTable("transaction_items", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  name: text("name").notNull(),
  sku: text("sku"),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
});

export const stockMovements = pgTable("stock_movements", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  type: text("type").notNull(),
  quantity: integer("quantity").notNull(),
  stockAfter: integer("stock_after").notNull(),
  note: text("note"),
  staff: text("staff"),
  referenceId: text("reference_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const checkoutIdempotency = pgTable("checkout_idempotency", {
  key: text("key").primaryKey(),
  requestHash: text("request_hash").notNull(),
  transactionId: text("transaction_id"),
  response: text("response"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});
