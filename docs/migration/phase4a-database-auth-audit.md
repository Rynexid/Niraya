# NIRAYA POS - Phase 4A: Database & Neon Auth Audit

Date: 2026-11-02  
Branch: feature/migrate-to-nextjs  
Project: Niraya POS  

## 1) Current Database Architecture

- **Database**: PostgreSQL (Neon)  
- **ORM**: Drizzle ORM  
- **Connection**: Uses `DATABASE_URL` / `DATABASE_URL_UNPOOLED` from Neon  
- **Schema location (Vite backup)**: `src/server/db/schema/*` (auth.ts, index.ts) - to be migrated to Next.js structure  
- **Migrations**: `drizzle.config.ts` exists in repo root (Vite era) - needs review for Next.js setup  

## 2) Existing Database Tables (from Vite schema)

From `src/server/db/schema/auth.ts` (custom auth era):
- `users` (id, name, email, password_hash, email_verified, created_at, updated_at)  
- `sessions` (id, user_id, expires_at, created_at)  

Note: Project later added Neon Auth integration. Neon Auth manages its own auth tables in the Neon project. We must not duplicate Neon Auth tables in app schema.

## 3) Current Authentication Implementation

- **Vite era**: Custom JWT cookie auth (email+password) in Hono routes (`src/server/routes/auth.ts`) with helpers in `src/server/lib/authHelpers.ts`
- **Next.js phase**: Demo/auth guard patterns exist; no real auth implemented yet in Next.js app
- **Neon Auth**: Installed packages present (`@neon/auth`, `@neon/auth-ui` related deps), env vars configured (`NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL`), project linked via neon.ts

## 4) Existing Neon Auth Implementation Findings

**Installed packages (from package.json):**
- `@neon/auth` ^0.8.2
- `@neon/config` ^1.10.0
- `@neon/env` ^1.6.8
- Related UI packages present

**Configuration:**
- `NEON_AUTH_BASE_URL` configured
- `NEON_AUTH_JWKS_URL` configured
- `neon.ts` exists with `auth: true`
- Neon CLI used previously

**Findings:**
- Neon Auth is enabled on the Neon project/branch
- Official Neon Auth SDK present - must use official integration, not Better Auth
- No Better Auth usage found in current Next.js setup

## 5) Official Neon Auth Integration Requirements

For `@neon/auth` v0.8.x with Next.js App Router:
- Use official server/client setup as documented for installed version
- Session validation via Neon Auth
- Route handlers for auth endpoints as per SDK docs
- Environment variables: `NEON_AUTH_BASE_URL` (and cookie secret if required by integration)
- Server-side session retrieval for protected routes
- Client SDK for auth actions

Must verify exact API against installed package docs/usage.

## 6) Proposed Next.js Authentication Architecture

```
src/
├── app/
│   ├── api/auth/[...path]/route.ts  # Neon Auth route handler
│   ├── (auth)/login/page.tsx
│   ├── (auth)/signup/page.tsx
│   └── (dashboard)/...              # protected
├── server/
│   ├── auth/                        # Neon Auth server config
│   └── db/                          # Drizzle
└── lib/
    └── auth-client.ts               # Neon Auth client
```

- Server Components check session via Neon Auth server utilities
- Middleware/proxy for route protection where appropriate
- Client components use Neon Auth client
- No custom JWT, no Better Auth

## 7) Identity-to-Business Relationship Design

- **Auth identity**: Managed by Neon Auth (separate from app tables)
- **App tables**: Create `user_profiles` or link via Neon Auth user id when needed
- **Business data**: Link to auth identity by external user id
- **Principle**: Keep auth and business authorization separate
- **No duplication** of auth credentials/tables

## 8) Authorization and Role Strategy

Proposed roles (to be confirmed against actual needs):
- `admin` / `owner`
- `manager`
- `cashier`
- `staff`

Store roles/permissions in app DB (e.g., `user_roles`, `business_memberships`) linked to Neon Auth user id. Enforce on server only.

## 9) Environment Variable Requirements

**Required (to verify):**
- `DATABASE_URL`
- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_JWKS_URL` (may be needed)

**Potential:**
- `NEON_AUTH_COOKIE_SECRET` (if using cookie session)
- App URL/origins for auth

Never commit real values. Update `.env.example` with placeholders.

## 10) Security Considerations

- Server-side session validation only
- Secure cookies
- Authorization checks on every protected operation
- No client-side trust of roles
- Input validation with Zod
- Proper error handling without leaking details

## 11) Migration Risks

- API differences between Neon Auth versions
- Cookie/domain configuration
- Route handler setup in Next.js App Router
- Ensuring no Better Auth leakage
- Preserving existing UI while wiring to real auth

## 12) Recommended Phase 4B Implementation Sequence

1. Review installed `@neon/auth` API/docs for v0.8.2
2. Setup Drizzle DB connection in Next.js (`src/server/db`)
3. Configure Neon Auth server/client
4. Add auth route handler
5. Wire login/signup pages to Neon Auth
6. Add server-side session checks + middleware/protection
7. Create minimal user-profile/role tables if needed
8. Add authorization helpers
9. Test flows
10. Update docs/env

**Status**: Audit complete. No implementation changes made. Ready for Phase 4B approval.
