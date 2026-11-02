# Niraya POS - Installation

## Prerequisites
- [Bun](https://bun.sh) >= 1.0
- [PostgreSQL](https://www.postgresql.org/) 16+ (or use Docker)

## Setup

1. Install dependencies
```bash
bun install
```

2. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your values
```

For the server, you can also create `server/.env` or use root `.env` (loaded by your shell). The backend reads from `process.env`.

3. Start PostgreSQL (option A: Docker)
```bash
docker compose up -d postgres
```

4. Generate and run database migrations
```bash
bun run db:generate
bun run db:migrate
```

5. Start development servers
```bash
# Frontend only
bun run dev

# Backend only
bun run dev:server

# Both (separate terminals recommended)
bun run dev:frontend
bun run dev:server
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Health check: http://localhost:4000/health
- Auth endpoints: http://localhost:4000/api/auth/*
