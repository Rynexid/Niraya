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

## Phase 8 (QR Ordering, dev branch `niraya-refactor-dev`) — PARTIAL
- Applied additive migrations on dev only: `drizzle/0002_qr_ordering.sql` (`core.DiningTables.QrType` + checks/index/general unique, payments status check alignment, checkout idempotency `Scope`), `drizzle/0003_qr_payments_nullable_tx.sql` (`payments.Payments.TransactionId` nullable for QR/manual flow; POS Phase 7 still sets it).
- Implemented backend foundations: secure QR tokens (`src/server/qr/token.ts`, raw shown once, SHA-256 hash stored, timing-safe verify), table/general QR management service/API (`src/server/qr/service.ts`, `src/app/api/staff/qr/tables`), in-memory rate-limit fallback (`src/server/security/rate-limit.ts`), private proof storage boundary (`src/server/storage/payment-proof.ts`, no public URLs).
- Public QR APIs (rate-limited, no internal IDs/hashes exposed): `/api/public/qr/resolve`, `/api/public/qr/catalog`, `/api/public/qr/checkout` (manual transfer only), `/api/public/qr/payments/proof` (multipart). QR checkout creates Unified `Orders/OrderItems` (`QR_TABLE`/`QR_GENERAL`, `SUBMITTED`/`PENDING`), guest snapshot (`CustomerId NULL`), server-side pricing/tax, idempotency, `InventoryReservations` + reserved quantity accounting.
- Manual payment: proof upload stores private key + marks pending submission; staff verification endpoint `/api/staff/qr/payments/verify` (manager) approves/rejects idempotently, converts reservations and releases reserved qty on approval (QR fulfillment/stock-movement finalization still partial). Cashier queue `/api/staff/qr/cashier-queue` returns only paid, non-cancelled, non-completed QR orders. Expiry job `/api/internal/jobs/expire-reservations` requires `Authorization: Bearer $CRON_SECRET`, uses row locks/skip-locked, idempotent.
- Tests (dev DB only): `bun run typecheck` pass; Phase 7 + Phase 8 targeted tests pass (`src/server/pos/checkout-phase7.test.ts`, `src/server/qr/phase8.test.ts`, 6 tests). Full Phase 8 acceptance matrix and UI not complete. Production DB not mutated.

## Phase 8G Hardening (dev branch, additive) — PARTIAL
- **8G.1 Guest access:** Added `transactions.GuestOrderAccess` (`drizzle/0004_guest_order_access.sql` applied dev only): SHA-256 token hash only, raw token 256-bit CSPRNG generated once at guest checkout, scoped to one Order, expiry/revoke/last-used fields. `src/server/qr/guest-access.ts` + checkout sets HttpOnly/SameSite cookie per order (`niraya_goat_*`, avoids overwriting other guest orders; Secure in production). New `GET /api/public/qr/orders/[orderId]` and proof upload require valid guest token (cookie/bearer, order-scoped hash+expiry+revocation) or matching authenticated `customerId` from Neon session; invalid access returns generic `403 "Akses tidak valid"` (no order existence leak on unauthorized path). Idempotent checkout cache no longer reissues raw guest token.
- **8G.2 QR fulfillment accounting:** `verifyManualPayment` is atomic/idempotent (advisory lock + row locks). On valid approve (PENDING, order not cancelled/expired, reservations RESERVED+unexpired, amount/currency match): creates legacy `transactions.Transactions` + `TransactionItems` snapshot once, links `payments.TransactionId`, sets payment/order `PAID`, converts RESERVED reservations once, releases reserved qty, deducts on-hand stock once (`inventory` + `products` cache), inserts `stockMovements` (`referenceType=qr_order_payment`), writes history. Duplicate approval returns idempotent result with no duplicate tx/items/stock/movements. Expired/cancelled/invalid states rejected; reject does not set PAID. POS Phase 7 path untouched.
- **8G.3 Rate limiting:** `src/server/security/rate-limit.ts` remains in-memory fixed-window fallback (dev/single instance). **Not distributed-safe on Vercel serverless**; needs Upstash/Redis provider config before claiming production protection. Limitation documented.
- **8G.4 Proof storage:** Local `.data/payment-proofs` boundary only for development (not durable on Vercel). Authz required to read proofs; guest proof upload now requires guest access token or authenticated owner. Still needs signature validation, durable private S3-compatible object storage, stronger CSRF/origin policy for cookie-based guest flows.
- **Tests (dev DB `niraya-refactor-dev`):** `bun run typecheck` ✅, `bun run build` ✅, targeted regression ✅ `bun test src/server/qr/phase8g.test.ts src/server/qr/phase8.test.ts src/server/pos/checkout-phase7.test.ts --timeout 30000` — **9 pass, 0 fail, 89 expect**. Covers guest token hash/no plaintext/valid/invalid/wrong-order, QR fulfillment tx/items/payment link/reservation conversion/stock+reserved deduction/stock movement/idempotent duplicate approval, expired reject/approve rejection. **Not tested:** full 8G matrix (revoked/expired token cases, authenticated-other-customer IDOR, wrong amount/currency, cancelled order, unauthorized staff route, concurrent approvals/orders, rollback simulation, proof file signature, rate-limit provider behavior, CSRF same-origin).


## Phase 8G.5–8G.7 hardening pass (dev only, additive-safe) — PARTIAL
- **DB target verified:** all writes/tests against `niraya-refactor-dev` (`br-lucky-boat-aoovo9ev`, DB `Niraya`, pooler host). No production branch access/mutation.
- **Guest access (8G.5/8G.7):** raw 256-bit token never stored (SHA-256 hash only), scoped to order, expiry+revocation checked (`resolveGuestAccess`), revoke helper added. Per-order HttpOnly/SameSite cookie (`niraya_goat_*`, Secure in prod) avoids multi-order overwrite. Public proof upload and guest order status require valid guest token (cookie/bearer) or authenticated session owner; invalid access returns generic 403. Same-origin guard added for cookie-authenticated state-changing public QR endpoints (`src/server/qr/request-security.ts`).
- **Fulfillment/accounting (8G.6):** approval uses advisory lock + row locks, validates PENDING/amount/currency/order not cancelled/expired, reservations RESERVED+unexpired, rejects RELEASED/EXPIRED/converted-inconsistent states, links existing tx defensively, creates at most 1 legacy Transaction + snapshot TransactionItems, converts reservations once, releases reserved qty, deducts on-hand once (inventory+products cache), records 1 stock movement, idempotent duplicate/concurrent approval path returns consistent result.
- **Proof storage (8G.7):** local private dev boundary only; added file signature sniffing (JPEG/PNG/WebP/PDF), size/type rejection, path traversal guard retained. **Not Vercel durable**; needs private S3-compatible object storage + authz/signed access policy.
- **Rate limiting:** in-memory fallback only; **not production/distributed safe** on Vercel. Needs Redis/Upstash provider.
- **Migrations:** no new migration added in this pass (uses `0004_guest_order_access.sql` already applied on dev).

### Test results (dev DB)
- `bun run typecheck` ✅
- `bun run build` ✅
- `bun test src/server/qr/phase8g.test.ts --timeout 30000` ✅ **11 pass, 0 fail, 72 expect**
- `bun test src/server/qr/phase8.test.ts` ✅ (part of prior targeted run)
- `bun test src/server/pos/checkout-phase7.test.ts` ✅ (part of prior targeted run)
- Combined targeted regression run: ✅ **15 pass, 0 fail, 118 expect** (`phase8g`+`phase8`+Phase 7)

### Security/concurrency matrix status
- **Tested (automated, DB-backed):** guest token hash/no plaintext/valid/invalid/missing/wrong-order/revoked/expired; idempotent checkout retry does not re-expose raw guest token; multi-order token independence/no transfer; fulfillment creates 1 tx/items/payment link/reservation conversion/stock+reserved once/1 movement; duplicate approval idempotent; concurrent approvals produce 1 fulfillment effect; amount/currency mismatch rejected; expired/cancelled approval rejected; reject not PAID; proof spoofed signature/oversized rejected; competing checkouts on limited stock do not oversell/reserve negative.
- **Partially tested / needs API-level tests:** authenticated customer A vs B ownership/IDOR, request body `customerId` override ignored, missing/invalid session on auth customer orders, unauthorized staff verify/proof access (role guard exists but not explicitly asserted in new tests), CSRF/origin behavior in browser context.
- **Not tested:** real database-failure rollback simulation at each fulfillment step (requires fault injection/transaction hook; would be unsafe/speculative to fake), reservation already converted/released edge states beyond covered paths, currency mismatch end-to-end at schema enum boundaries, duplicate proof upload idempotency policy, distributed rate-limit behavior.

### Remaining risks / production blockers
- In-memory rate limiting not distributed (Vercel multi-instance bypass risk).
- Local proof storage not durable/public-prod safe; file-signature sniffing is basic (not full malware/content scanning).
- CSRF/origin guard is minimal for cookie flows; needs full same-site/cookie policy review, token rotation/revoke API UX, and browser integration tests.
- Authenticated-customer order access depends on Neon session identity mapping to `order.customerId`; needs explicit IDOR tests.
- Staff authorization relies on `requireRole`; fine-grained action permission tests needed.
- No UI (8H). No refund workflow. No production migration/deploy.

## Phase 8G.8 Authorization, Rollback & Request Security Closure (dev only) — PARTIAL
- **Commit context:** continued from `af5df3a` on `dev`. DB target confirmed: `niraya-refactor-dev` (`br-lucky-boat-aoovo9ev`, DB `Niraya`) for all DB-backed tests/writes; production untouched.
- **Migrations:** none added/applied. No destructive SQL/reset/truncate/delete-existing-data.

### 8G.8.1 API authorization / IDOR (route-level, mocked auth+session, real DB fixtures)
- Added `src/server/qr/phase8g-api.test.ts` (uses `mock.module` for `@/lib/auth` and `@/server/auth/session`, invokes actual route handlers).
- **Tested:** guest token for Order A cannot access Order B (`GET /api/public/qr/orders/[orderId]`) — 403; valid token for own order — 200. Authenticated customer A cannot access customer B order — 403; missing session cannot access authenticated (customer-owned) order — 403. Unauthorized staff (cashier role) cannot verify payments (`POST /api/staff/qr/payments/verify`) — 403 and cannot read private proof (`GET /api/staff/qr/payments/proof`) — 403; manager passes authz (proof may be 404 if absent). Customer A cannot upload proof for customer B’s payment (`POST /api/public/qr/payments/proof`) — 403.
- **Request body `customerId` override:** public QR routes do not accept `customerId` as ownership authority; guest access uses order-scoped token, authenticated access uses Neon session user id vs `order.customerId`. No route-level test injects body `customerId` yet because endpoints don’t take it; documented as design-level mitigation.

### 8G.8.2 DB rollback fault injection (real DB transactions)
- Added controlled test fault hook in `verifyManualPayment` (`opts._faultAfter` for `tx_insert|items_insert|inventory_update|movement_insert|payment_update|order_update`; test-only, throws to force transaction rollback). No POS Phase 7 behavior change.
- **Tested (real dev DB):** fault after `inventory_update` and after `tx_insert` → thrown `TEST_FAULT`; payment not PAID/no `transactionId`, order not PAID/no `linkedTransactionId`, no partial tx/movement persisted, `inventory.stockQuantity/reservedQuantity` and reservation `RESERVED` state restored as pre-fulfillment. **Verified rollback for exercised steps**.
- **Not fully tested:** fault injection after every listed step in production code paths (payment/order update/history) and all item/reservation loop permutations; fault hook is test instrumentation (minimal risk). No claim of exhaustive rollback proof.

### 8G.8.3 CSRF/cookie/request security
- `src/server/qr/request-security.ts` minimal same-origin guard for cookie-authenticated state-changing public QR endpoints (checkout/proof). Allows non-cookie/non-browser-missing-origin cases (documented risk); rejects mismatched Origin/Host. Cookies remain HttpOnly, SameSite=Lax, per-order name `niraya_goat_*` (isolation), Secure in production.
- **Tested:** `request-security.test.ts` — no cookie allows; cookie + matching origin/host allows; cookie + cross-origin rejects (403); cookie + missing origin allows (non-browser fallback, documented risk).
- **Not fully browser-tested:** Referer fallback policy not implemented; cross-origin browser behavior, CSRF token defense, token rotation UX, and duplicate proof idempotency policy remain partial.

### 8G.8.4 Cancellation & refund policy audit (documentation only)
- **Current implementation:** QR orders can reach expired states via reservation expiry; manual approval rejects expired/cancelled orders; paid QR fulfillment creates legacy financial Transaction and stock movement; no automatic refund/restock workflow implemented.
- **Proposed lifecycle (not implemented, requires approved plan):**
  - *Unpaid/pending manual-transfer order cancellation:* allowed only before PAID; release RESERVED reservations, restore `reservedQuantity`, set payment/order non-PAID terminal/cancelled states, write history; no financial Transaction created.
  - *Expired reservation:* current expiry releases reservation/reserved qty and marks expired; preserve history.
  - *Paid order cancellation:* **never delete** paid order/payment/transaction; create explicit reversal/refund record and compensating stock movement only with approved policy/permission.
  - *Full/partial refund:* separate refund entities/workflow, idempotent, authorized, linked to original payment/transaction; partial refunds must not assume full stock restoration.
  - *Stock restoration:* never automatic on refund/cancellation without explicit policy (damaged/consumed goods); if restored, create compensating `stockMovements`/inventory updates atomically and auditable.
  - *Financial history preservation:* immutable/auditable; use reversals/refunds, not destructive edits.
- **No refund API/schema migration added.**

### Regression results (dev DB)
- `bun run typecheck` ✅
- `bun run build` ✅
- `bun test src/server/qr/request-security.test.ts src/server/qr/phase8g.test.ts src/server/qr/phase8g-api.test.ts src/server/qr/phase8.test.ts src/server/pos/checkout-phase7.test.ts --timeout 30000` ✅ **27 pass, 0 fail, 152 expect** (5 files)

### Remaining production blockers
- Distributed rate limiting (Redis/Upstash) required; in-memory unsafe on Vercel.
- Durable private object storage for payment proofs (S3-compatible/private, signed access); local `.data` dev-only.
- Full browser CSRF/origin/referrer policy and token rotation/revoke UX.
- Complete API-level authz/IDOR coverage and staff permission assertions.
- Exhaustive rollback/fault-injection coverage for all fulfillment steps and loop paths.
- Approved cancellation/refund implementation plan (no speculative auto-restock).
- UI Phase 8H not started. No production migration/deploy.
