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

import { DEFAULT_BUSINESS_ID, nirayaSchema } from "./schema";
import { businesses } from "./core";

const niraya = nirayaSchema;

/** Metode pembayaran yang tersedia di POS. */
export const paymentMethods = niraya.table(
  "PaymentMethods",
  {
    code: text("Code").primaryKey(),
    name: text("Name").notNull(),
    isActive: boolean("IsActive").notNull().default(true),
    requiresReference: boolean("RequiresReference").notNull().default(false),
    sortOrder: integer("SortOrder").notNull().default(0),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("PaymentMethods_IsActive_idx").on(t.isActive),
    index("PaymentMethods_SortOrder_idx").on(t.sortOrder),
  ]
);

/** Tarif pajak per bisnis. */
export const taxRates = niraya.table(
  "TaxRates",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("Name").notNull(),
    rate: numeric("Rate", { precision: 5, scale: 4 }).notNull().default("0"),
    isDefault: boolean("IsDefault").notNull().default(false),
    isActive: boolean("IsActive").notNull().default(true),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("TaxRates_BusinessId_Name_key").on(t.businessId, t.name),
    index("TaxRates_BusinessId_idx").on(t.businessId),
    index("TaxRates_IsDefault_idx").on(t.isDefault),
    check("TaxRates_Rate_check", sql`${t.rate} >= 0 and ${t.rate} <= 1`),
  ]
);

/** Diskon yang dapat diterapkan ke transaksi. */
export const discounts = niraya.table(
  "Discounts",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("Name").notNull(),
    code: text("Code").notNull(),
    type: text("Type").notNull().default("fixed"),
    value: numeric("Value", { precision: 14, scale: 2 }).notNull().default("0"),
    isActive: boolean("IsActive").notNull().default(true),
    startsAt: timestamp("StartsAt", { withTimezone: true }),
    endsAt: timestamp("EndsAt", { withTimezone: true }),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("Discounts_BusinessId_Code_key").on(t.businessId, t.code),
    index("Discounts_BusinessId_idx").on(t.businessId),
    index("Discounts_IsActive_idx").on(t.isActive),
    check("Discounts_Type_check", sql`${t.type} in ('percentage', 'fixed')`),
    check("Discounts_Value_check", sql`${t.value} >= 0`),
    check(
      "Discounts_PercentageValue_check",
      sql`${t.type} <> 'percentage' or ${t.value} <= 100`
    ),
  ]
);
