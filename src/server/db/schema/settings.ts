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
import { businesses, stores } from "./core";

const niraya = nirayaSchema;

/** Pengaturan tingkat bisnis. */
export const businessSettings = niraya.table(
  "BusinessSettings",
  {
    id: text("Id").primaryKey().default("default"),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    businessName: text("BusinessName").notNull(),
    address: text("Address").notNull().default(""),
    phone: text("Phone").notNull().default(""),
    email: text("Email").notNull().default(""),
    currency: text("Currency").notNull().default("IDR"),
    timezone: text("Timezone").notNull().default("Asia/Jakarta"),
    taxRate: numeric("TaxRate", { precision: 5, scale: 4 })
      .notNull()
      .default("0"),
    memberDiscountRate: numeric("MemberDiscountRate", {
      precision: 5,
      scale: 4,
    })
      .notNull()
      .default("0"),
    lowStockThreshold: integer("LowStockThreshold").notNull().default(10),
    /**
     * Kolom lama dipertahankan agar data receipt footer tidak hilang saat
     * migrasi. Sumber baru ada di `ReceiptSettings.Footer`.
     */
    legacyReceiptFooter: text("LegacyReceiptFooter").notNull().default(""),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("BusinessSettings_BusinessId_idx").on(t.businessId),
    check(
      "BusinessSettings_TaxRate_check",
      sql`${t.taxRate} >= 0 and ${t.taxRate} <= 1`
    ),
    check(
      "BusinessSettings_MemberDiscountRate_check",
      sql`${t.memberDiscountRate} >= 0 and ${t.memberDiscountRate} <= 1`
    ),
    check(
      "BusinessSettings_LowStockThreshold_check",
      sql`${t.lowStockThreshold} >= 0`
    ),
  ]
);

/** Override pengaturan per toko. */
export const storeSettings = niraya.table(
  "StoreSettings",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    storeId: uuid("StoreId")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    lowStockThreshold: integer("LowStockThreshold"),
    taxRate: numeric("TaxRate", { precision: 5, scale: 4 }),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("StoreSettings_StoreId_key").on(t.storeId),
    index("StoreSettings_BusinessId_idx").on(t.businessId),
    check(
      "StoreSettings_TaxRate_check",
      sql`${t.taxRate} is null or (${t.taxRate} >= 0 and ${t.taxRate} <= 1)`
    ),
    check(
      "StoreSettings_LowStockThreshold_check",
      sql`${t.lowStockThreshold} is null or ${t.lowStockThreshold} >= 0`
    ),
  ]
);

/** Konfigurasi struk / receipt. */
export const receiptSettings = niraya.table(
  "ReceiptSettings",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    storeId: uuid("StoreId").references(() => stores.id, {
      onDelete: "cascade",
    }),
    header: text("Header").notNull().default(""),
    footer: text("Footer").notNull().default(""),
    showTax: boolean("ShowTax").notNull().default(true),
    showCashier: boolean("ShowCashier").notNull().default(true),
    paperWidth: integer("PaperWidth").notNull().default(58),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("ReceiptSettings_BusinessId_idx").on(t.businessId),
    index("ReceiptSettings_StoreId_idx").on(t.storeId),
    check(
      "ReceiptSettings_PaperWidth_check",
      sql`${t.paperWidth} in (58, 80)`
    ),
  ]
);
