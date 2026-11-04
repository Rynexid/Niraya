import {
  integer,
  numeric,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { nirayaSchema } from "./schema";

export const customers = nirayaSchema.table("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  notes: text("notes"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
});

export const staff = nirayaSchema.table("staff", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("cashier"),
  status: text("status").notNull().default("active"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  lastActive: timestamp("last_active", { withTimezone: true }),
});

export const settings = nirayaSchema.table("settings", {
  id: text("id").primaryKey().default("default"),
  businessName: text("business_name").notNull(),
  address: text("address").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  currency: text("currency").notNull().default("IDR"),
  timezone: text("timezone").notNull().default("Asia/Jakarta"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  memberDiscountRate: numeric("member_discount_rate", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(10),
  receiptFooter: text("receipt_footer").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
