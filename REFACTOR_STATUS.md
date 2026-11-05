# Niraya Refactor Status (automated, safe pass)

## Hard safety rules followed
- No `DROP DATABASE/SCHEMA/TABLE`, no `TRUNCATE/DELETE` as reset, no DB reset/recreation.
- `neon_auth` not modified. Existing migration files/journal not overwritten; no destructive `drizzle-kit push`.
- No production migration/deployment executed. `NEON_AUTH_COOKIE_SECRET`/secrets not exposed.
- Neon Auth kept. No Better Auth/custom JWT. No `tenantId`. Single business + primary store defaults preserved.

## Neon safety / environment (verified)
- Project `cool-feather-71549850` “Niraya”, PG18, `aws-ap-southeast-1`, default branch `br-morning-king-aouagwa6` (production, protected data). Neon Auth enabled (`better_auth`) on production branch DB `Niraya`.
- `.env`/local config inspected (keys only). App uses pooled `DATABASE_URL` for runtime; direct URL required for migrations (not swapped in app). No credentials logged.
- Created **dev branch** for migration testing: `niraya-refactor-dev` (`br-lucky-boat-aoovo9ev`, parent `production` @ `0/3F31D78`, created 2026-11-05T17:37:32Z). **Additive migration `drizzle/0001_unified_core.sql` applied on dev branch only** and verified (tables/columns/index seeds present; existing transactions/payments counts unchanged: 4/4).

## Implemented (this pass)
- `ARCHITECTURE_AUDIT.md`: repo+DB audit, Neon safety report, existing→target mapping, status models, migration/recovery strategy.
- `drizzle/0001_unified_core.sql` (additive, dev-branch tested): `core.DiningTables`; `transactions.Orders/OrderItems/OrderStatusHistory` (unified POS+QR operational model); `inventory.InventoryReservations`; `settings.BusinessSettings` QR/manual-transfer/gateway-status/reservation-expiry extensions; `payments.Payments` extensions (OrderId, channel/provider refs, proof/verification/expiry/metadata, expanded status check safely) + `manual_transfer` payment method; `CheckoutIdempotency.OrderId`. **No legacy tables/data dropped.**
- Drizzle schema additions (typecheck/build pass): `src/server/db/schema/orders.ts`, `inventory-reservations.ts`, exports; `settings.ts` fixed/extended; minor lint cleanup in schema files.
- Optional gateway scaffold, **separate from core** (not mixed into core journal): `drizzle/modules/payment-gateway/{README.md,payment-gateway.sql,payment-gateway-refunds.sql}`. Core has no mandatory FK to gateway tables.
- Verification run (local, not production): `bun run typecheck` ✅, `bun run build` ✅, `bun run lint` ⚠️ existing/pre-existing warnings remain (no errors blocking build in this run).

## Not fully implemented (requires follow-up; too large/risky for blind completion)
- Full backend domain refactor (all APIs/services/UI flows): unified POS+QR order services end-to-end, public QR catalog/order/payment routes with token validation/rate limiting, cashier order queue/status transitions/history enforcement, manual transfer proof upload+authorized verification workflow, gateway provider abstraction + webhook signature/idempotency handlers, reservation expiry worker (idempotent), refunds workflow/UI (manual vs gateway, no auto-restock unless explicit + movement), reporting updates to avoid double-counting.
- Frontend: owner QR/tables/payment-policy settings, dining table QR generation/rotation (hash storage), customer QR pages (catalog/cart/guest contact/order/payment/proof/status), cashier verification/queue/refunds, responsive states.
- Data migration/backfill: legacy `Transactions/TransactionItems` → optional `Orders/OrderItems` mapping **not executed** (must be validated against real data; preserve IDs/history). `CheckoutIdempotency`/existing POS flow preserved; `POST /api/pos/checkout` still works against legacy model — must be carefully migrated to create linked Order+Transaction without duplicate financial records.
- Automated tests for new critical behaviors (gateway webhooks idempotency, reservation oversell/expiry/release-convert, manual proof verification auth, QR token/IDOR/rate limits). Existing DB-coupled `bun test` may require controlled test DB/branch env; **not claimed passing** beyond build/typecheck.

## Production runbook (explicit approval required)
1. Verify Neon backup/recovery point for `production` (`br-morning-king-aouagwa6`). 2. Re-test `drizzle/0001_unified_core.sql` (and subsequent reviewed migrations) on a fresh dev branch from current production LSN. 3. Review/handle Drizzle migration journal mismatch (DB has no `__drizzle_migrations` table; journal only has `0000_init`) — do **not** reset journal; use explicit SQL apply + recordkeeping or a carefully approved baseline strategy. 4. Apply additive SQL to production only with explicit approval, maintenance window, and rollback plan. 5. Deploy app only after schema compatibility verified.

## Known DB state notes
- `drizzle` migration table absent in DB; core init applied historically via SQL. Production still has only legacy unified tables plus this refactor’s target tables **only on dev branch** unless explicitly applied later.
- Payment method `qris` exists; `manual_transfer` added by 0001 (dev). Gateway tables not installed in DB.
