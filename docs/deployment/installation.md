# Installation Guide

## Prerequisites
- Node.js 20+ (recommended 22+)
- Bun (or npm/pnpm/yarn)
- PostgreSQL database (Neon recommended)
- Reverse proxy (nginx/caddy) for HTTPS

## Steps
1. Clone/copy source code
2. Install dependencies: `bun install` or `npm ci`
3. Configure environment: copy `.env.example` to `.env.local`/`.env` and set values
4. Setup database: run migrations with `bun run db:migrate` or `npx drizzle-kit migrate`
5. Build: `bun run build`
6. Start: `bun run start` (or use process manager like PM2/systemd)
