# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Frontend production build (React + Vite) served by nginx.
# ---------------------------------------------------------------------------
FROM oven/bun:1.4-alpine AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Baked into the bundle at build time. Leave empty for same-origin deployments
# where nginx proxies /api to the backend.
ARG VITE_API_URL=""
RUN printf 'VITE_API_URL=%s\n' "$VITE_API_URL" > .env.production \
  && bun run build

FROM nginx:1.29-alpine AS runtime

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
