# Niraya POS - Project Structure

```
niraya/
├── src/                    # Frontend (React + Vite)
│   ├── assets/
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   ├── layout/
│   │   └── shared/
│   ├── features/
│   │   ├── dashboard/
│   │   ├── pos/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── customers/
│   │   ├── transactions/
│   │   ├── reports/
│   │   └── settings/
│   ├── hooks/
│   ├── lib/                # Utilities (cn, etc.)
│   ├── routes/
│   ├── services/
│   ├── stores/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── server/                 # Backend API (Hono)
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema/     # Drizzle schemas
│   │   │   └── migrations/
│   │   ├── middleware/
│   │   ├── modules/
│   │   ├── routes/
│   │   ├── lib/            # Auth, env, db
│   │   └── index.ts
│   ├── drizzle.config.ts
│   └── package.json
├── docs/                   # Documentation
├── components.json         # shadcn/ui config
├── vite.config.ts
├── docker-compose.yml
└── package.json            # Root workspace (frontend)
```
