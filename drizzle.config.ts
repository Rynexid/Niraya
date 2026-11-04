import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/db/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  // `push`/introspect hanya mengelola schema bisnis `niraya`.
  // Schema `auth` dipakai bersama Neon Auth, jadi tabel `auth.user_profiles`
  // dibuat lewat migrasi (`db:migrate`) agar tabel Neon Auth tidak tersentuh.
  schemaFilter: ["niraya"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
