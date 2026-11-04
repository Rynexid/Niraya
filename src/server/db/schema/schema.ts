import { pgSchema } from "drizzle-orm/pg-core";

/**
 * Schema organisasi database NIRAYA POS.
 *
 * - `niraya` — seluruh tabel bisnis (PascalCase, dikelola aplikasi).
 * - `auth`   — tabel milik Neon Auth (lowercase, dikelola Neon Auth) dan
 *              `auth."UserProfiles"` yang menghubungkan identitas Neon Auth
 *              dengan role aplikasi.
 *
 * Catatan: tabel internal Neon Auth tidak boleh di-rename karena kontrak
 * service Neon Auth bergantung pada nama tersebut. Tabel aplikasi wajib
 * menggunakan PascalCase.
 */
export const DB_SCHEMA = "niraya";
export const AUTH_SCHEMA = "auth";

export const nirayaSchema = pgSchema(DB_SCHEMA);
export const authSchema = pgSchema(AUTH_SCHEMA);

/**
 * Identitas bisnis dan toko default untuk instalasi single-business.
 * Nilai ini dipakai sebagai default kolom kepemilikan agar data lama tetap
 * valid saat migrasi. Multi-business dapat menambahkan baris baru dan
 * mengisi kolom BusinessId/StoreId secara eksplisit.
 */
export const DEFAULT_BUSINESS_ID = "00000000-0000-0000-0000-000000000001";
export const DEFAULT_STORE_ID = "00000000-0000-0000-0000-000000000002";
