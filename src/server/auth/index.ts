import { env } from "@/lib/env";
import { createNeonAuth } from "@neon/auth/next/server";

export const auth = createNeonAuth({
  baseUrl: env.NEON_AUTH_BASE_URL,
  cookies: {
    secret: env.NEON_AUTH_COOKIE_SECRET,
  },
});
