# NIRAYA POS - Phase 6: API & Integrations

## Endpoint Inventory (from git history)
- app/routes/api.auth.$.ts (React Router) - Better Auth handler

## Current State
- Next.js app uses Neon Auth (not Better Auth)
- Auth handled via /api/auth/[...path] route handler (Neon Auth)
- Business modules use client-side stores (Zustand) with demo data
- No separate Hono server in Next.js branch

## Migration Plan
- Auth: Already migrated to Neon Auth Route Handler
- Business APIs: Implement Route Handlers under src/app/api as needed
- Remove Hono dependencies if unused

## Health Check
- Add /api/health route

## Status
Phase 6 prepared - inventory complete
