# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Niraya API (Hono + Drizzle + Better Auth)
# ---------------------------------------------------------------------------

# Build stage also serves as the migration runner (it keeps drizzle-kit).
FROM oven/bun:1.4-alpine AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY tsconfig.json drizzle.config.ts ./
COPY src ./src
COPY drizzle ./drizzle

RUN bun run build

# ---------------------------------------------------------------------------
# Runtime: self-contained bundle, no node_modules required.
# ---------------------------------------------------------------------------
FROM oven/bun:1.4-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/health || exit 1

USER bun

CMD ["bun", "dist/index.js"]
