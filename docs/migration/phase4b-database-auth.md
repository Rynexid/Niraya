# NIRAYA POS - Phase 4B: Database & Neon Auth Implementation

## Status
Completed - Phase 4B implementation

## Architecture
- Next.js 16 App Router
- Neon Auth (@neon/auth) as sole auth provider
- Drizzle ORM + PostgreSQL (Neon)
- Server-side session validation
- Route protection via middleware

## Database
- Connection: src/server/db/index.ts (server-only)
- Schema: src/server/db/schema/user.ts (user_profiles linked to Neon Auth user id)
- Migrations: drizzle/ (generated via drizzle-kit)

## Neon Auth
- Server config: src/server/auth/index.ts (createNeonAuth)
- Client config: src/lib/auth-client.ts (createAuthClient)
- Route handler: src/app/api/auth/[...path]/route.ts (authApiHandler)
- Proxy: src/proxy.ts

## Auth UI
- Login: src/app/(auth)/login/page.tsx (wired to authClient.signIn.email)
- Signup: src/app/(auth)/signup/page.tsx (wired to authClient.signUp.email)
- Preserved layout/theme/typography

## Protection
- Middleware protects routes, public: /login, /signup
- Server helper: src/lib/auth.ts (getSession/getUser)

## Environment
See .env.example for required variables:
- DATABASE_URL
- NEON_AUTH_BASE_URL
- NEON_AUTH_COOKIE_SECRET
- NEON_AUTH_JWKS_URL
- NEXT_PUBLIC_NEON_AUTH_URL

## Commands
- db:generate: drizzle-kit generate
- db:migrate: drizzle-kit migrate
- db:push: drizzle-kit push
- db:studio: drizzle-kit studio
