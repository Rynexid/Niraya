# AGENTS.md

## Stack
- Next.js 16 (App Router), React 19, TypeScript (strict). Path alias `@/*` -> `./src/*` (see `tsconfig.json`).
- Runtime/package manager: Bun (`package.json` scripts use `bun` for tests/seed). Lockfile `bun.lock`.
- Styling: Tailwind CSS v4, shadcn/ui components in `src/components/ui/`.
- Lint: `oxlint` (config `.oxlintrc.json`), ESLint via `eslint-config-next`.
- DB: Drizzle ORM + `pg`/`postgres`. Schema in `src/server/db/schema/` (split by domain), output `./drizzle`. Drizzle config filters to schema `niraya` only; auth schema is shared with Neon Auth and must not be touched by schema push/migrations in that scope (see `drizzle.config.ts`).

## Commands
- `bun dev` - start dev server (Next)
- `bun build` / `bun start`
- `bun lint` - oxlint
- `bun run typecheck` - `tsc --noEmit`
- `bun test` - bun test
- `bun db:generate` / `bun db:migrate` / `bun db:push` / `bun db:studio`
- `bun db:seed` - runs `src/server/db/seed-business.ts`

## Auth & Middleware
- Auth via `@neon/auth/next/server` (`src/server/auth/index.ts`), client helpers in `src/lib/auth.ts`/`src/lib/auth-client.ts`.
- Route protection via `src/proxy.ts` using `auth.middleware` with `loginUrl: "/login"` and `publicRoutes: ["/login", "/signup", "/api/business", "/api/demo/seed"]`. Matcher excludes static assets.
- Required env (see `.env.example`): `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `NEON_AUTH_JWKS_URL`, `NEXT_PUBLIC_NEON_AUTH_URL`, `NEXT_PUBLIC_APP_URL`. Freemius vars are server-only.

## DB Notes
- Drizzle connection in `src/server/db/index.ts`: uses `process.env.DATABASE_URL` (falls back to dummy for safety) with `node-postgres` Pool; schema names are written explicitly (no reliance on `search_path`).
- Schema filter `schemaFilter: ["niraya"]` in Drizzle config - do not modify Neon Auth tables via `db:push`/generated migrations targeting auth.
- Neon config in `neon.ts` (auth enabled, branch TTL policy for non-default branches).

## Codebase Layout (high-signal)
- `src/app/` - App Router pages/routes
- `src/components/` - shared/UI components (shadcn in `ui/`)
- `src/features/` - feature modules
- `src/server/` - server code: `auth/`, `db/`, `repositories/`, `services/`, `business/`
- `src/lib/` - shared libs/helpers
- `src/hooks/`, `src/stores/`, `src/shared/`, `src/types/`

## Gotchas
- Linting uses oxlint with overrides disabling `react/only-export-components` in `src/components/ui/**` (see `.oxlintrc.json`).
- Next config enables `reactCompiler: true`.
- Tests run with `bun test` (see `src/server/auth/session.test.ts`, `src/server/business/*.test.ts`).
