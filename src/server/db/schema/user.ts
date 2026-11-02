import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  neonAuthUserId: text("neon_auth_user_id").notNull().unique(),
  name: text("name"),
  email: text("email"),
  role: text("role").default("cashier").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
