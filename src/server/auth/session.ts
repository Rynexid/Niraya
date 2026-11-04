import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { userProfiles } from "@/server/db/schema/user";
import { getSession } from "@/lib/auth";

export type UserRole = "owner" | "admin" | "manager" | "cashier";

const ROLE_RANK: Record<UserRole, number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  cashier: 1,
};

/**
 * Cek apakah role pengguna memenuhi role yang dibutuhkan (atau lebih tinggi).
 */
export function hasRole(userRole: UserRole | undefined, required: UserRole) {
  if (!userRole) return false;
  return ROLE_RANK[userRole] >= ROLE_RANK[required];
}

/**
 * Ambil role pengguna saat ini dari sesi Neon Auth + tabel user_profiles.
 * Jika profil belum ada, kembali ke "cashier" sebagai default aman.
 */
export async function getCurrentUserRole(): Promise<UserRole> {
  const session = await getSession();
  const user =
    (session as any)?.user ?? (session as any)?.data?.user ?? null;

  if (!user?.id) return "cashier";

  const [profile] = await db
    .select({ role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.neonAuthUserId, String(user.id)))
    .limit(1);

  const role = profile?.role as UserRole | undefined;
  return role ?? "cashier";
}

/**
 * Pastikan pengguna saat ini memiliki role yang cukup. Lempar jika tidak.
 */
export async function requireRole(required: UserRole): Promise<UserRole> {
  const role = await getCurrentUserRole();
  if (!hasRole(role, required)) {
    const err: any = new Error("Akses ditolak: role tidak cukup.");
    err.status = 403;
    throw err;
  }
  return role;
}

/**
 * Role minimum yang diperlukan per aksi bisnis.
 */
export const ACTION_ROLES: Record<string, UserRole> = {
  // Kategori
  "category.create": "manager",
  "category.update": "manager",
  "category.delete": "owner",
  // Produk
  "product.create": "manager",
  "product.update": "manager",
  "product.status": "manager",
  "product.delete": "owner",
  // Pelanggan
  "customer.create": "manager",
  "customer.update": "manager",
  "customer.delete": "owner",
  // Staf
  "staff.create": "admin",
  "staff.update": "admin",
  "staff.delete": "owner",
  // Stok
  "stock.adjust": "manager",
  // Transaksi
  "transaction.void": "manager",
  // Pengaturan
  "settings.update": "admin",
};
