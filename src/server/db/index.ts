import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy";

const pool = new Pool({ connectionString });

export const db = drizzle(pool);
