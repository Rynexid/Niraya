import {
  check,
  index,
  integer,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { DEFAULT_BUSINESS_ID, DEFAULT_STORE_ID, inventorySchema } from "./schema";
import { businesses, stores } from "./core";
import { products } from "./products";
import { orderItems, orders } from "./orders";

const s = inventorySchema;

export const inventoryReservations = s.table(
  "InventoryReservations",
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
    orderId: text("OrderId")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    orderItemId: text("OrderItemId").references(() => orderItems.id, {
      onDelete: "cascade",
    }),
    productId: text("ProductId")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: integer("Quantity").notNull(),
    status: text("Status").notNull().default("RESERVED"),
    expiresAt: timestamp("ExpiresAt", { withTimezone: true }),
    releasedAt: timestamp("ReleasedAt", { withTimezone: true }),
    convertedAt: timestamp("ConvertedAt", { withTimezone: true }),
    releaseReason: text("ReleaseReason"),
    createdAt: timestamp("CreatedAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("InventoryReservations_OrderId_idx").on(t.orderId),
    index("InventoryReservations_ProductId_idx").on(t.productId),
    index("InventoryReservations_Status_idx").on(t.status),
    index("InventoryReservations_ExpiresAt_idx").on(t.expiresAt),
    check("InventoryReservations_Quantity_check", sql`${t.quantity} > 0`),
    check(
      "InventoryReservations_Status_check",
      sql`${t.status} in ('RESERVED','RELEASED','CONVERTED','EXPIRED')`
    ),
  ]
);
