# Vercel Deployment Guide

## Prerequisites
- Vercel account
- GitHub repo connected
- Neon Postgres project
- Neon Auth configured

## Build Configuration
- Framework: Next.js
- Build Command: `npm run build` or `bun run build` (use package manager from repo)
- Output Directory: `.next` (default)
- Install Command: auto-detected
- Node.js Runtime: use default

## Environment Variables
Set in Vercel Project Settings > Environment Variables:
- DATABASE_URL (server)
- NEON_AUTH_BASE_URL (server)
- NEON_AUTH_COOKIE_SECRET (server, secret)
- NEON_AUTH_JWKS_URL (server)
- NEXT_PUBLIC_NEON_AUTH_URL (public)
- NEXT_PUBLIC_APP_URL (public)
- NODE_ENV=production

Never commit secrets. Use Vercel encrypted env vars.

## Neon Auth Production
- Configure allowed origins/callback URLs in Neon Auth for production domain
- Update NEXT_PUBLIC_NEON_AUTH_URL to production auth URL
- Ensure cookies work with HTTPS domain

## Database Migrations
- Migrations must be run separately (not during serverless function cold starts)
- Run `npx drizzle-kit migrate` or `bun run db:migrate` from CI/local with production DATABASE_URL
- Do not rely on automatic migration execution

## Connection Pooling
- Use Neon pooled connection string (DATABASE_URL) for serverless
- Avoid long-lived connections in serverless functions

## File Storage
- No local filesystem persistence used; all data in Postgres/Neon

## Preview Deployments
- Use preview env vars
- Test auth flows with preview URLs

## Production Promotion Checklist
- [ ] Build passes
- [ ] Env vars set
- [ ] Migrations applied
- [ ] Auth configured for domain
- [ ] Health check OK
- [ ] Smoke test critical flows

## Troubleshooting
- Check function logs in Vercel
- Verify env vars in deployment
- Ensure no Node APIs incompatible with serverless
