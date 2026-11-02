# Niraya POS

A self-hosted point of sale platform by **Rynex**. This repository contains the
frontend, the API and the deployment tooling. Business modules are not
implemented yet — the current goal is a complete, production-oriented
development environment.

## Stack

- **Frontend:** React 19, Vite 8, TypeScript 7, React Router 7
- **UI:** Tailwind CSS v4, shadcn/ui (Radix UI), Lucide, sonner
- **Typography:** Plus Jakarta Sans (UI), JetBrains Mono (identifiers/receipts)
- **State and forms:** TanStack Query, Zustand, React Hook Form, Zod
- **Backend:** Hono, PostgreSQL, Drizzle ORM, Better Auth
- **Tooling:** Bun, Oxlint, Docker Compose

## Quick start

```bash
bun run setup

cp .env.example .env
cp server/.env.example server/.env
# set BETTER_AUTH_SECRET in server/.env: openssl rand -base64 32

bun run db:up        # PostgreSQL via Docker (or use a local instance)
bun run db:migrate   # apply the committed migration

bun run dev:server   # API on http://localhost:3000
bun run dev          # frontend on http://localhost:5173
```

Full instructions: [docs/INSTALLATION.md](docs/INSTALLATION.md).

## Design system

The UI kit is implemented and documented in [DESIGN.md](DESIGN.md). It follows
the Google Stitch direction: neutral surfaces, blue primary, Plus Jakarta Sans,
restrained radius and elevation, and no decorative gradients.

| Area              | Location                                      |
| ----------------- | --------------------------------------------- |
| Design tokens     | `src/styles/themes.css` (light + dark values) |
| Tailwind bridge   | `src/styles/globals.css` (`@theme`, base layer) |
| shadcn primitives | `src/components/ui/`                          |
| Layout            | `src/components/layout/`                      |
| Navigation        | `src/components/navigation/`                  |
| Forms             | `src/components/forms/`                       |
| Data display      | `src/components/data-display/`                |
| Feedback          | `src/components/feedback/`                    |
| POS components    | `src/components/pos/`                         |
| Shared            | `src/components/shared/`                      |
| Shared POS types  | `src/types/pos.ts`                            |
| Formatting        | `src/lib/format.ts`, `src/lib/constants.ts`   |

An interactive catalogue is available at **`/design-system`** in development and
preview builds. It is lazy-loaded so the initial bundle stays small.

An application shell (collapsible sidebar, sticky top navigation) and a
**Dashboard** page (`/dashboard`) are implemented on top of the UI kit. A
standalone **Login** page (`/login`) uses the shadcn `login-02` template with a
frontend-only demo account (`admin@niraya.pos` / `niraya123`). The dashboard
reuses existing UI Kit components (`RevenueMetric`, `Card`, `Table`, `Badge`,
`Select`, `DropdownMenu`, `ThemeToggle`, recharts) and uses illustrative demo
data only.

### UI commands

```bash
bun run dev          # catalogue at http://localhost:5173/design-system
bun run typecheck    # TypeScript project references
bun run lint         # Oxlint
bun run build        # production build
```

Components are added with the shadcn CLI:

```bash
bunx --bun shadcn@latest add <component>
```

The `form` item is not shipped by the current radix registry, so
`src/components/ui/form.tsx` is maintained in-repo. Use `cn()` from
`@/lib/utils` for conditional classes.

## Documentation

| Document                                           | Contents                                      |
| -------------------------------------------------- | --------------------------------------------- |
| [DESIGN.md](DESIGN.md)                             | Design tokens, typography, components, themes |
| [docs/TECH_STACK.md](docs/TECH_STACK.md)           | Packages, versions and architecture decisions |
| [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) | Directory layout and conventions          |
| [docs/INSTALLATION.md](docs/INSTALLATION.md)       | Setup, scripts, verification and deployment   |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)         | Frontend/backend variables and security rules |

## Repository layout

```
src/       React frontend (Vite)
server/    Hono API (independent Bun package)
deploy/    nginx configuration for production
docs/      Project documentation
```

The frontend and API are separate packages with separate lockfiles. They can be
deployed together with the provided `docker-compose.yml` or independently on a
customer's own VPS.
# Niraya
