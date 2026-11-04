import {
  integer,
  numeric,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { nirayaSchema } from "./schema";

export const categories = nirayaSchema.table("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const products = nirayaSchema.table("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode"),
  categoryId: text("category_id"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  cost: numeric("cost", { precision: 12, scale: 2 }).notNull().default("0"),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(0),
  unit: text("unit").notNull().default("pcs"),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
