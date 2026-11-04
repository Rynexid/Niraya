import {
  boolean,
  check,
  index,
  integer,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { authSchema, nirayaSchema } from "./schema";

const niraya = nirayaSchema;
const auth = authSchema;

/**
 * Role aplikasi. `user` adalah role dasar; role operasional berada di atasnya.
 * Role disimpan sebagai lookup agar RBAC dapat dikelola tanpa mengubah tabel
 * profil pengguna.
 */
export const roles = niraya.table(
  "Roles",
  {
    code: text("Code").primaryKey(),
    name: text("Name").notNull(),
    description: text("Description"),
    rank: integer("Rank").notNull().default(0),
    isSystem: boolean("IsSystem").notNull().default(true),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("Roles_Name_key").on(t.name),
    index("Roles_Rank_idx").on(t.rank),
    check(
      "Roles_Rank_check",
      sql`${t.rank} >= 0`
    ),
  ]
);

/** Permission granular untuk RBAC. */
export const permissions = niraya.table(
  "Permissions",
  {
    code: text("Code").primaryKey(),
    name: text("Name").notNull(),
    description: text("Description"),
    module: text("Module").notNull(),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("Permissions_Name_key").on(t.name),
    index("Permissions_Module_idx").on(t.module),
  ]
);

/** Pemetaan many-to-many role ke permission. */
export const rolePermissions = niraya.table(
  "RolePermissions",
  {
    roleCode: text("RoleCode")
      .notNull()
      .references(() => roles.code, { onDelete: "cascade" }),
    permissionCode: text("PermissionCode")
      .notNull()
      .references(() => permissions.code, { onDelete: "cascade" }),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    primaryKey({
      name: "RolePermissions_pkey",
      columns: [t.roleCode, t.permissionCode],
    }),
    index("RolePermissions_RoleCode_idx").on(t.roleCode),
    index("RolePermissions_PermissionCode_idx").on(t.permissionCode),
  ]
);

/** Entitas bisnis. Satu instalasi dapat memiliki satu atau banyak bisnis. */
export const businesses = niraya.table(
  "Businesses",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    name: text("Name").notNull(),
    slug: text("Slug").notNull(),
    legalName: text("LegalName"),
    taxId: text("TaxId"),
    currency: text("Currency").notNull().default("IDR"),
    timezone: text("Timezone").notNull().default("Asia/Jakarta"),
    ownerUserId: text("OwnerUserId"),
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
    unique("Businesses_Slug_key").on(t.slug),
    index("Businesses_Status_idx").on(t.status),
    check(
      "Businesses_Status_check",
      sql`${t.status} in ('active', 'suspended', 'archived')`
    ),
  ]
);

/** Toko/outlet milik bisnis. */
export const stores = niraya.table(
  "Stores",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("Name").notNull(),
    code: text("Code").notNull(),
    address: text("Address"),
    phone: text("Phone"),
    email: text("Email"),
    timezone: text("Timezone").notNull().default("Asia/Jakarta"),
    isActive: boolean("IsActive").notNull().default(true),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("DeletedAt", { withTimezone: true }),
  },
  (t) => [
    unique("Stores_BusinessId_Code_key").on(t.businessId, t.code),
    index("Stores_BusinessId_idx").on(t.businessId),
    index("Stores_IsActive_idx").on(t.isActive),
  ]
);

/**
 * Profil aplikasi untuk identitas Neon Auth.
 * `UserId` menyimpan id user Neon Auth; tidak ada password/credential di sini.
 */
export const userProfiles = auth.table(
  "UserProfiles",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    userId: text("UserId").notNull(),
    name: text("Name"),
    email: text("Email"),
    role: text("Role")
      .notNull()
      .default("user")
      .references(() => roles.code, { onDelete: "restrict" }),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("DeletedAt", { withTimezone: true }),
  },
  (t) => [
    unique("UserProfiles_UserId_key").on(t.userId),
    index("UserProfiles_Role_idx").on(t.role),
    index("UserProfiles_Email_idx").on(t.email),
  ]
);

/** Keanggotaan user pada bisnis, dengan role dan akses toko opsional. */
export const businessMembers = niraya.table(
  "BusinessMembers",
  {
    id: uuid("Id").defaultRandom().primaryKey(),
    businessId: uuid("BusinessId")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: text("UserId").notNull(),
    role: text("Role")
      .notNull()
      .default("user")
      .references(() => roles.code, { onDelete: "restrict" }),
    storeId: uuid("StoreId").references(() => stores.id, {
      onDelete: "set null",
    }),
    status: text("Status").notNull().default("active"),
    invitedAt: timestamp("InvitedAt", { withTimezone: true }),
    joinedAt: timestamp("JoinedAt", { withTimezone: true }),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("UpdatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("DeletedAt", { withTimezone: true }),
  },
  (t) => [
    unique("BusinessMembers_BusinessId_UserId_key").on(
      t.businessId,
      t.userId
    ),
    index("BusinessMembers_BusinessId_idx").on(t.businessId),
    index("BusinessMembers_UserId_idx").on(t.userId),
    index("BusinessMembers_StoreId_idx").on(t.storeId),
    check(
      "BusinessMembers_Status_check",
      sql`${t.status} in ('invited', 'active', 'suspended', 'removed')`
    ),
  ]
);
