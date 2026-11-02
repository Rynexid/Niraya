import { integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: text("number").notNull().unique(),
  cashierId: text("cashier_id"),
  customerId: uuid("customer_id"),
  paymentMethod: text("payment_method").notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 12, scale: 2 }).default("0"),
  tax: numeric("tax", { precision: 12, scale: 2 }).default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }),
  changeAmount: numeric("change_amount", { precision: 12, scale: 2 }),
  status: text("status").default("completed").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactionItems = pgTable("transaction_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionId: uuid("transaction_id").notNull().references(() => transactions.id),
  productId: uuid("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
});

export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull(),
  type: text("type").notNull(),
  quantity: integer("quantity").notNull(),
  referenceId: uuid("reference_id"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const checkoutIdempotency = pgTable("checkout_idempotency", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  requestHash: text("request_hash").notNull(),
  transactionId: uuid("transaction_id"),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});
