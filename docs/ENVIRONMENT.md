# Niraya POS - Environment Variables

## Frontend (.env)
Only `VITE_*` variables are exposed to the client bundle. Never put secrets here.

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:4000` |

## Backend (server/.env or environment)
| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | API port | `4000` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `BETTER_AUTH_SECRET` | Secret for Better Auth (min 32 chars) | - |
| `BETTER_AUTH_URL` | Public URL of the API | - |
| `CORS_ORIGIN` | Allowed CORS origin (frontend URL) | `http://localhost:5173` |
