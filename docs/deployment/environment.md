# Environment Configuration

## Required Variables
- `DATABASE_URL` - Neon Postgres connection string (server only)
- `NEON_AUTH_BASE_URL` - Neon Auth base URL (server)
- `NEON_AUTH_COOKIE_SECRET` - Cookie secret (server only, min 32 chars)
- `NEON_AUTH_JWKS_URL` - JWKS URL (server)
- `NEXT_PUBLIC_NEON_AUTH_URL` - Neon Auth URL for client
- `NEXT_PUBLIC_APP_URL` - Public app URL
- `NODE_ENV` - production/development

## Notes
- Never commit secrets
- Server-only vars must not be prefixed with NEXT_PUBLIC_
- See `.env.example` for placeholders
