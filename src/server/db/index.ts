import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // During build time without env vars, create a dummy db instance
  // This will be replaced at runtime with real env vars
  const dummyPool = new Pool({ connectionString: "postgres://dummy:dummy@localhost:5432/dummy" });
  export const db = drizzle(dummyPool);
} else {
  const pool = new Pool({ connectionString });
  export const db = drizzle(pool);
}
