import {
  check,
  index,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { DEFAULT_BUSINESS_ID, nirayaSchema } from "./schema";
import { businesses } from "./core";

const niraya = nirayaSchema;

/** Pemasok barang. */
export const suppliers = niraya.table(
  "Suppliers",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("Name").notNull(),
    contactName: text("ContactName"),
    phone: text("Phone"),
    email: text("Email"),
    address: text("Address"),
    taxId: text("TaxId"),
    notes: text("Notes"),
    status: text("Status").notNull().default("active"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("DeletedAt", { withTimezone: true }),
  },
  (t) => [
    index("Suppliers_BusinessId_idx").on(t.businessId),
    index("Suppliers_Name_idx").on(t.name),
    index("Suppliers_Status_idx").on(t.status),
    check(
      "Suppliers_Status_check",
      sql`${t.status} in ('active', 'inactive', 'archived')`
    ),
  ]
);
