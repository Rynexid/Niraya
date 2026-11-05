import {
  boolean,
  check,
  index,
  integer,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { DEFAULT_BUSINESS_ID, customersSchema } from "./schema";
import { businesses } from "./core";

const s = customersSchema;

/** Pelanggan milik bisnis. */
export const customers = s.table(
  "Customers",
  {
    id: text("Id").primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .default(DEFAULT_BUSINESS_ID)
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("Name").notNull(),
    phone: text("Phone").notNull(),
    email: text("Email"),
    notes: text("Notes"),
    loyaltyPoints: integer("LoyaltyPoints").notNull().default(0),
    joinedAt: timestamp("JoinedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("DeletedAt", { withTimezone: true }),
  },
  (t) => [
    index("Customers_BusinessId_idx").on(t.businessId),
    index("Customers_Phone_idx").on(t.phone),
    index("Customers_Email_idx").on(t.email),
    index("Customers_Name_idx").on(t.name),
    check("Customers_LoyaltyPoints_check", sql`${t.loyaltyPoints} >= 0`),
  ]
);

/** Alamat pelanggan (bisa lebih dari satu). */
export const customerAddresses = s.table(
  "CustomerAddresses",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    customerId: text("CustomerId")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    label: text("Label").notNull().default("Utama"),
    recipientName: text("RecipientName"),
    phone: text("Phone"),
    addressLine1: text("AddressLine1").notNull(),
    addressLine2: text("AddressLine2"),
    city: text("City"),
    province: text("Province"),
    postalCode: text("PostalCode"),
    country: text("Country").notNull().default("Indonesia"),
    isPrimary: boolean("IsPrimary").notNull().default(false),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("CustomerAddresses_CustomerId_idx").on(t.customerId),
    index("CustomerAddresses_IsPrimary_idx").on(t.isPrimary),
  ]
);
