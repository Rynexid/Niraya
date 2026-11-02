import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEON_AUTH_BASE_URL: z.string().min(1),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32),
  NEON_AUTH_JWKS_URL: z.string().min(1),
  NEXT_PUBLIC_NEON_AUTH_URL: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL,
  NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET,
  NEON_AUTH_JWKS_URL: process.env.NEON_AUTH_JWKS_URL,
  NEXT_PUBLIC_NEON_AUTH_URL: process.env.NEXT_PUBLIC_NEON_AUTH_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
});

export type Env = z.infer<typeof envSchema>;
