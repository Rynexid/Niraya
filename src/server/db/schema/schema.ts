import { pgSchema } from "drizzle-orm/pg-core";

/**
 * Tabel aplikasi Niraya dipisah dari schema `public`:
 *
 * - `niraya` — data bisnis (katalog, stok, transaksi, pelanggan, staf, dll).
 * - `auth`   — data yang berkaitan dengan login/akun aplikasi.
 *
 * Schema `neon_auth` tetap dikelola oleh Neon Auth dan tidak disentuh di sini.
 */
export const DB_SCHEMA = "niraya";
export const AUTH_SCHEMA = "auth";

export const nirayaSchema = pgSchema(DB_SCHEMA);
export const authSchema = pgSchema(AUTH_SCHEMA);
