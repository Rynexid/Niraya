import { text, timestamp, uuid } from "drizzle-orm/pg-core";

import { authSchema } from "./schema";

/**
 * Profil akun aplikasi. Disimpan di schema `auth` karena berkaitan langsung
 * dengan proses login, terpisah dari data bisnis di schema `niraya`.
 */
export const userProfiles = authSchema.table("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  neonAuthUserId: text("neon_auth_user_id").notNull().unique(),
  name: text("name"),
  email: text("email"),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
