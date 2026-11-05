# Niraya POS — Repository & Database Audit, Target Mapping, Neon Safety (Phase 1/2 Draft)

> Generated during automated refactor. **No destructive DB operations executed. No production migrations/deployments executed.** Neon Auth (`neon_auth`) untouched.

## 1. Repository Audit Summary

- **Stack:** Next.js 16.4.4 App Router, React 19, TypeScript strict, Tailwind v4/shadcn/Radix, Drizzle ORM + `pg` (node-postgres Pool), Neon PostgreSQL (PG18, `cool-feather-71549850`, AWS ap-southeast-1), Neon Auth (`@neon/auth` server+client+middleware via `src/proxy.ts`), Vercel target. Bun package manager/scripts.
- **Branch/worktree:** `master` @ `a28145a` (clean for tracked work before this task except user conversation context); `feature/migrate-to-nextjs` exists.
- **Auth:** Neon Auth via `createNeonAuth` (`src/server/auth/index.ts`, cookie secret env), `/api/auth/[...path]` handler, `src/proxy.ts` middleware. App RBAC in `core.UserProfiles` + `core.Roles/Permissions/RolePermissions`; normal `user` role restricted from dashboard in UI/layout/server checks. `ensureUserProfile` creates default `user` profile. Neon Auth tables managed by Neon — **not modified**.
- **API routes (current):** `GET/POST /api/business` (hydration + mutations, RBAC via `ACTION_ROLES`, demo cookie bypass exists), `POST /api/pos/checkout` (transactional checkout: advisory lock idempotency, `FOR UPDATE` on products/inventory, server-side pricing/tax, creates `transactions.Transaction(s)`, `TransactionItems`, `Payments`, `TransactionDiscounts`, stock deduction + `StockMovements`), `/api/auth/[...path]`, `/api/me`, `/api/health`, `/api/demo/seed`.
- **POS/checkout safety (preserved):** DB transaction, `pg_advisory_xact_lock(hashtext(idempotencyKey))`, canonical item sort + request hash, `FOR UPDATE` on products/inventory ordered by id, server-calculated subtotal/discount/tax/total, cash paid validation, idempotent cached response via `transactions.CheckoutIdempotency`.
- **Domain services:** `src/server/business/service.ts` handles category/product/customer/staff CRUD, stock adjust (tx + FOR UPDATE + `StockAdjustments` + `StockMovements`), `transaction.void` (tx, restores stock, marks voided), settings update. Single-business defaults `DEFAULT_BUSINESS_ID/STORE_ID`.
- **Frontend:** Dashboard/POS/inventory/products/customers/staff/transactions/reports/settings/help features; Zustand `business-store` + TanStack Query hydration; POS cart/checkout dialog; no QR/public ordering, no dining tables UI, no manual transfer verification UI, no gateway UI.
- **Tests:** `bun test` tests exist (`src/server/business/service.test.ts`, `checkout.test.ts`, `src/server/auth/session.test.ts`) — DB-coupled/integration style; `tsconfig` excludes `*.test.*` from production typecheck/build. `bun run typecheck` and `bun run build` passed before this refactor task.

## 2. Neon Database Safety Report (Initial)

- **Target (from env, secrets not printed):** project `cool-feather-71549850` ("Niraya"), region `aws-ap-southeast-1`, PG18, org `org-floral-firefly-25450512`. Default/production branch `br-morning-king-aouagwa6` ("production", ready). `DATABASE_URL` points to pooled endpoint DB `Niraya` (production branch context). **All existing data treated as protected.**
- **Branches present:** `production` (default, ready), `feature/migrate-to-pascalcase` (child, old snapshot). A **new dedicated dev branch** must be created for migration testing before applying additive migrations.
- **Actual schemas (app + neon):** `audit, core, customers, demo, inventory, lookups, neon_auth, payments, products, purchases, settings, staff, suppliers, transactions`. No `drizzle` migrations schema/table found in DB. `drizzle/meta/_journal.json` has only `0000_init`; `drizzle/0000_init.sql` exists. **Migration history in DB not tracked by drizzle migrations table** — use explicit additive SQL on dev branch and careful journal handling; never reset journal/history.
- **Neon Auth:** `neon_auth` schema present and enabled (`better_auth`) — **never modified**.
- **Row counts (sample, production DB at audit time):** businesses 1, stores 1, products 3, categories 5, customers 10, transactions 4, tx_items 5, payments 4, inventory 3, movements 13. **No truncation/deletion performed.**
- **Missing target objects (not present):** `DiningTables`, `Orders/OrderItems/OrderStatusHistory` (no operational order tables; `purchases.PurchaseOrders` exists but unrelated), `InventoryReservations`, gateway tables, manual-transfer/payment-proof fields, QR policy fields. `TransactionRefunds/RefundItems` exist in `payments` schema (legacy-compatible) but lack some target fields (provider/manual distinction, requested/approved, completed timestamps nuances) — must extend additively if needed.
- **Backup/dev branch:** **Not yet verified/created in this session** for the refactor work. Before any migration execution, create/verify a Neon dev branch (TTL/ephemeral) and test there. **No backup claimed beyond Neon’s platform capabilities; recovery strategy required before mutating.**
- **Safety status:** `Implemented=No DB mutations`, `Tested=N/A`, `Production migration=Not applied`, `Requires explicit approval` for any destructive/production action.

## 3. Existing → Target Schema Mapping (Phase 2)

| Existing | Target (unified) | Action (additive/safe) |
|---|---|---|
| `transactions.Transactions` | Financial/receipt `Transactions` (kept) + operational `Orders`? | **Keep** `Transactions/TransactionItems/CheckoutIdempotency` intact. Introduce `Orders`, `OrderItems`, `OrderStatusHistory` as operational source of truth for POS+QR. POS checkout will create/link Order+Transaction safely (single financial transaction per paid/completed flow) without duplicating editable item sources. Legacy TransactionItems preserved; no deletion. |
| `transactions.TransactionItems` | `OrderItems` snapshots | Preserve legacy; new orders use `OrderItems` with product/variant/SKU/unit price/qty/discount/tax/subtotal snapshots. |
| `payments.Payments` | `Payments` (core) | Extend additively: `OrderId` nullable, `PaymentStatus` alignment, `Provider/Channel`/manual-transfer metadata, proof/reference/verification fields as needed, currency/amount guards. Core supports cash + manual bank transfer. No mandatory gateway FK. |
| `payments.TransactionRefunds/Items` | `Refunds` | Preserve existing tables/data. Extend additively if safe (requested/approved/provider refs/manual vs gateway, status). Do not auto-restock; explicit rule + `StockMovements`. Gateway refund details belong to optional module. |
| `customers.Customers` | `Customers` (guest-capable) | Keep table; make/linkage rules support guest contact snapshots on orders; `CustomerId` nullable on orders. Do **not** equate with Neon Auth users. |
| `products.*` (Products, Variants, Barcodes) | same | Reuse existing structures; extend only if required (e.g. variant snapshot fields on items, active flags). Prefer deactivation over delete for historical refs. |
| `inventory.Inventory/StockMovements/StockAdjustments` | same + `InventoryReservations` | Preserve concurrency protections. Add `InventoryReservations` (order/item/product/store, qty, status, expires_at, converted/released refs) with tx + row locking semantics; reservation lifecycle must be idempotent. |
| *(none)* | `core.DiningTables` | Add table: id, store/business, table number/name, **high-entropy QR token hash** (opaque; no sequential ID as token), active, timestamps. Token validation server-side. |
| *(none)* | `settings` payment/QR policy | Extend `BusinessSettings`/`StoreSettings` additively with QR ordering policy (manual transfer enabled OR QR disabled when no gateway), manual transfer bank/instructions config, gateway module status flags (server-checked). No secrets in plain settings. |
| `transactions.CheckoutIdempotency` | shared/extended idempotency | Preserve POS idempotency; add order/QR/payment idempotency keys as needed without breaking existing checkout. |
| *(none)* | `modules/payment-gateway/*` | **Separate optional SQL module** (own folder/journal guidance). Tables only as needed: configs (non-secret refs), gateway transactions, webhook events, gateway refunds. Core has no mandatory FK to gateway tables. |

## 4. Status Models (Target)

- **OrderStatus:** `DRAFT, SUBMITTED, ACCEPTED, PREPARING, READY, COMPLETED, CANCELLED` (+ history table).
- **PaymentStatus:** `UNPAID, PENDING, PAID, FAILED, EXPIRED, PARTIALLY_REFUNDED, REFUNDED`.
- Operational and financial statuses separate. Unpaid/unverified orders never enter production queue. `PAID != COMPLETED`. Manual transfer proof submission never auto-marks PAID.

## 5. Migration & Recovery Strategy (No prod mutation)

1. **Never** DROP/TRUNCATE/reset DB, never touch `neon_auth`, never overwrite applied migrations, never `drizzle-kit push` destructively, never deploy/apply to production automatically.
2. Create a **new Neon dev branch** from `production` with TTL (ephemeral) for refactor testing; get direct connection string for migrations/tests. Keep `production` unchanged.
3. Generate additive SQL migrations (next valid IDs after `0000_init`) in Drizzle core path **or** explicit SQL files reviewed against snapshot; prefer SQL applied via `Neon_run_sql`/psql-equivalent on **dev branch only** because DB has no drizzle migration tracking table. Record mapping carefully.
4. Add nullable/safe-default columns first; backfill safely; add FKs/unique constraints only after data validation. `RESTRICT` for historical financial refs; deactivation over delete.
5. Optional gateway SQL in `drizzle/modules/payment-gateway/` with separate lifecycle/journal — **not mixed** with core migrations.
6. Verify dev branch results (schema + smoke queries/tests) before reporting. Production application requires explicit user approval + separate runbook.

## 6. Non-Negotiables Check

- Neon Auth kept; no Better Auth/custom JWT. No `tenantId` cross-business isolation. One business + one primary store defaults preserved. Existing stack preserved. No unrelated rewrites.


## 7. Dev Branch (created for safe migration testing)

- **Branch:** `niraya-refactor-dev` (`br-lucky-boat-aoovo9ev`, project `cool-feather-71549850`), parent `production` (`br-morning-king-aouagwa6`) at creation LSN `0/3F31D78`. Created 2026-11-05T17:37:32Z. **No production mutations.**
- **Plan:** apply additive core migrations here first; verify schema/smoke; then report. Optional gateway module remains separate (`drizzle/modules/payment-gateway/`, not core journal). Production migration requires explicit approval + runbook.

