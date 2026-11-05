-- Phase 8 QR Ordering (ADDITIVE ONLY). Apply on development branch first.
-- Supports Table QR and General QR without breaking existing DiningTables rows.

ALTER TABLE "core"."DiningTables"
  ADD COLUMN IF NOT EXISTS "QrType" text NOT NULL DEFAULT 'TABLE';

DO $$ BEGIN
  ALTER TABLE "core"."DiningTables"
    ADD CONSTRAINT "DiningTables_QrType_check" CHECK ("QrType" IN ('TABLE','GENERAL'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- One general QR per store/business context.
CREATE UNIQUE INDEX IF NOT EXISTS "DiningTables_GeneralQR_Store_key"
  ON "core"."DiningTables" ("StoreId") WHERE "QrType" = 'GENERAL';

CREATE INDEX IF NOT EXISTS "DiningTables_QrType_idx" ON "core"."DiningTables" ("QrType");

-- Payments: align with unified statuses used by QR/manual verification flows.
-- Keep legacy lowercase statuses for compatibility.
ALTER TABLE "payments"."Payments" DROP CONSTRAINT IF EXISTS "Payments_Status_check";
ALTER TABLE "payments"."Payments"
  ADD CONSTRAINT "Payments_Status_check" CHECK (
    "Status" IN (
      'pending','completed','failed','refunded','expired','partially_refunded',
      'UNPAID','PENDING','PAID','FAILED','EXPIRED','PARTIALLY_REFUNDED','REFUNDED',
      'WAITING_PROOF','PENDING_VERIFICATION','REJECTED'
    )
  );

-- QR checkout idempotency scope marker (additive). Existing rows unaffected.
ALTER TABLE "transactions"."CheckoutIdempotency" ADD COLUMN IF NOT EXISTS "Scope" text;
