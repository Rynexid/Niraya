-- Niraya POS: unified operational Orders + QR/manual-payment/reservation foundations.
-- ADDITIVE ONLY. Safe for populated tables (nullable/safe defaults). Apply on dev branch first.
-- Does NOT touch neon_auth, does NOT drop/truncate existing data/tables.

CREATE SCHEMA IF NOT EXISTS "core";
CREATE SCHEMA IF NOT EXISTS "transactions";
CREATE SCHEMA IF NOT EXISTS "payments";
CREATE SCHEMA IF NOT EXISTS "inventory";
CREATE SCHEMA IF NOT EXISTS "settings";

-- Core: dining tables for QR_TABLE / QR_GENERAL (tokens stored as hashes; never sequential IDs as security tokens)
CREATE TABLE IF NOT EXISTS "core"."DiningTables" (
  "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "BusinessId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES "core"."Businesses"("Id") ON DELETE CASCADE,
  "StoreId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000002' REFERENCES "core"."Stores"("Id") ON DELETE CASCADE,
  "TableNumber" text,
  "Name" text,
  "QrTokenHash" text NOT NULL,
  "IsActive" boolean NOT NULL DEFAULT true,
  "CreatedAt" timestamptz NOT NULL DEFAULT now(),
  "UpdatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "DiningTables_QrTokenHash_key" UNIQUE ("QrTokenHash"),
  CONSTRAINT "DiningTables_StoreId_TableNumber_key" UNIQUE ("StoreId", "TableNumber")
);
CREATE INDEX IF NOT EXISTS "DiningTables_BusinessId_idx" ON "core"."DiningTables" ("BusinessId");
CREATE INDEX IF NOT EXISTS "DiningTables_StoreId_idx" ON "core"."DiningTables" ("StoreId");
CREATE INDEX IF NOT EXISTS "DiningTables_IsActive_idx" ON "core"."DiningTables" ("IsActive");

-- Operational orders (unified POS + QR). Financial Transactions/Payments preserved separately.
CREATE TABLE IF NOT EXISTS "transactions"."Orders" (
  "Id" text PRIMARY KEY,
  "BusinessId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES "core"."Businesses"("Id") ON DELETE CASCADE,
  "StoreId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000002' REFERENCES "core"."Stores"("Id") ON DELETE RESTRICT,
  "OrderNumber" text NOT NULL,
  "OrderSource" text NOT NULL,
  "OrderStatus" text NOT NULL DEFAULT 'SUBMITTED',
  "PaymentStatus" text NOT NULL DEFAULT 'UNPAID',
  "DiningTableId" uuid REFERENCES "core"."DiningTables"("Id") ON DELETE SET NULL,
  "CustomerId" text REFERENCES "customers"."Customers"("Id") ON DELETE SET NULL,
  "CustomerName" text,
  "CustomerPhone" text,
  "CashierId" text,
  "CashierName" text,
  "OrderType" text NOT NULL DEFAULT 'dine-in',
  "TableNumber" text,
  "PaymentMethod" text,
  "Currency" text NOT NULL DEFAULT 'IDR',
  "Subtotal" numeric(14,2) NOT NULL DEFAULT 0,
  "DiscountTotal" numeric(14,2) NOT NULL DEFAULT 0,
  "TaxTotal" numeric(14,2) NOT NULL DEFAULT 0,
  "GrandTotal" numeric(14,2) NOT NULL DEFAULT 0,
  "AmountPaid" numeric(14,2),
  "ChangeAmount" numeric(14,2),
  "IdempotencyKey" text,
  "LinkedTransactionId" text REFERENCES "transactions"."Transactions"("Id") ON DELETE SET NULL,
  "Notes" text,
  "CancelReason" text,
  "SubmittedAt" timestamptz,
  "PaidAt" timestamptz,
  "CompletedAt" timestamptz,
  "CreatedAt" timestamptz NOT NULL DEFAULT now(),
  "UpdatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "Orders_OrderNumber_key" UNIQUE ("OrderNumber"),
  CONSTRAINT "Orders_IdempotencyKey_key" UNIQUE ("IdempotencyKey"),
  CONSTRAINT "Orders_OrderSource_check" CHECK ("OrderSource" IN ('POS','QR_TABLE','QR_GENERAL')),
  CONSTRAINT "Orders_OrderStatus_check" CHECK ("OrderStatus" IN ('DRAFT','SUBMITTED','ACCEPTED','PREPARING','READY','COMPLETED','CANCELLED')),
  CONSTRAINT "Orders_PaymentStatus_check" CHECK ("PaymentStatus" IN ('UNPAID','PENDING','PAID','FAILED','EXPIRED','PARTIALLY_REFUNDED','REFUNDED')),
  CONSTRAINT "Orders_Amounts_check" CHECK ("Subtotal" >= 0 AND "DiscountTotal" >= 0 AND "TaxTotal" >= 0 AND "GrandTotal" >= 0)
);
CREATE INDEX IF NOT EXISTS "Orders_BusinessId_idx" ON "transactions"."Orders" ("BusinessId");
CREATE INDEX IF NOT EXISTS "Orders_StoreId_idx" ON "transactions"."Orders" ("StoreId");
CREATE INDEX IF NOT EXISTS "Orders_Status_idx" ON "transactions"."Orders" ("OrderStatus");
CREATE INDEX IF NOT EXISTS "Orders_PaymentStatus_idx" ON "transactions"."Orders" ("PaymentStatus");
CREATE INDEX IF NOT EXISTS "Orders_Source_idx" ON "transactions"."Orders" ("OrderSource");
CREATE INDEX IF NOT EXISTS "Orders_CreatedAt_idx" ON "transactions"."Orders" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "Orders_DiningTableId_idx" ON "transactions"."Orders" ("DiningTableId");

CREATE TABLE IF NOT EXISTS "transactions"."OrderItems" (
  "Id" text PRIMARY KEY,
  "OrderId" text NOT NULL REFERENCES "transactions"."Orders"("Id") ON DELETE CASCADE,
  "ProductId" text NOT NULL REFERENCES "products"."Products"("Id") ON DELETE RESTRICT,
  "ProductVariantId" uuid REFERENCES "products"."ProductVariants"("Id") ON DELETE SET NULL,
  "ProductName" text NOT NULL,
  "Sku" text,
  "VariantName" text,
  "Quantity" integer NOT NULL,
  "UnitPrice" numeric(14,2) NOT NULL,
  "DiscountTotal" numeric(14,2) NOT NULL DEFAULT 0,
  "TaxTotal" numeric(14,2) NOT NULL DEFAULT 0,
  "Subtotal" numeric(14,2) NOT NULL,
  "Notes" text,
  "CreatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrderItems_Quantity_check" CHECK ("Quantity" > 0),
  CONSTRAINT "OrderItems_Amounts_check" CHECK ("UnitPrice" >= 0 AND "DiscountTotal" >= 0 AND "TaxTotal" >= 0 AND "Subtotal" >= 0)
);
CREATE INDEX IF NOT EXISTS "OrderItems_OrderId_idx" ON "transactions"."OrderItems" ("OrderId");
CREATE INDEX IF NOT EXISTS "OrderItems_ProductId_idx" ON "transactions"."OrderItems" ("ProductId");

CREATE TABLE IF NOT EXISTS "transactions"."OrderStatusHistory" (
  "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "OrderId" text NOT NULL REFERENCES "transactions"."Orders"("Id") ON DELETE CASCADE,
  "FromOrderStatus" text,
  "ToOrderStatus" text NOT NULL,
  "FromPaymentStatus" text,
  "ToPaymentStatus" text,
  "ChangedByUserId" text,
  "ChangedByRole" text,
  "Reason" text,
  "CreatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "OrderStatusHistory_OrderId_idx" ON "transactions"."OrderStatusHistory" ("OrderId");
CREATE INDEX IF NOT EXISTS "OrderStatusHistory_CreatedAt_idx" ON "transactions"."OrderStatusHistory" ("CreatedAt");

-- Inventory reservations (QR submit -> reserve; fail/expire -> release; fulfill -> convert). Idempotent processing expected.
CREATE TABLE IF NOT EXISTS "inventory"."InventoryReservations" (
  "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "BusinessId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES "core"."Businesses"("Id") ON DELETE CASCADE,
  "StoreId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000002' REFERENCES "core"."Stores"("Id") ON DELETE CASCADE,
  "OrderId" text NOT NULL REFERENCES "transactions"."Orders"("Id") ON DELETE CASCADE,
  "OrderItemId" text REFERENCES "transactions"."OrderItems"("Id") ON DELETE CASCADE,
  "ProductId" text NOT NULL REFERENCES "products"."Products"("Id") ON DELETE RESTRICT,
  "Quantity" integer NOT NULL,
  "Status" text NOT NULL DEFAULT 'RESERVED',
  "ExpiresAt" timestamptz,
  "ReleasedAt" timestamptz,
  "ConvertedAt" timestamptz,
  "ReleaseReason" text,
  "CreatedAt" timestamptz NOT NULL DEFAULT now(),
  "UpdatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "InventoryReservations_Quantity_check" CHECK ("Quantity" > 0),
  CONSTRAINT "InventoryReservations_Status_check" CHECK ("Status" IN ('RESERVED','RELEASED','CONVERTED','EXPIRED'))
);
CREATE INDEX IF NOT EXISTS "InventoryReservations_OrderId_idx" ON "inventory"."InventoryReservations" ("OrderId");
CREATE INDEX IF NOT EXISTS "InventoryReservations_ProductId_idx" ON "inventory"."InventoryReservations" ("ProductId");
CREATE INDEX IF NOT EXISTS "InventoryReservations_Status_idx" ON "inventory"."InventoryReservations" ("Status");
CREATE INDEX IF NOT EXISTS "InventoryReservations_ExpiresAt_idx" ON "inventory"."InventoryReservations" ("ExpiresAt");

-- Settings extensions (nullable/safe defaults)
ALTER TABLE "settings"."BusinessSettings" ADD COLUMN IF NOT EXISTS "QrOrderingEnabled" boolean NOT NULL DEFAULT false;
ALTER TABLE "settings"."BusinessSettings" ADD COLUMN IF NOT EXISTS "QrManualTransferEnabled" boolean NOT NULL DEFAULT false;
ALTER TABLE "settings"."BusinessSettings" ADD COLUMN IF NOT EXISTS "ManualTransferBankName" text;
ALTER TABLE "settings"."BusinessSettings" ADD COLUMN IF NOT EXISTS "ManualTransferAccountName" text;
ALTER TABLE "settings"."BusinessSettings" ADD COLUMN IF NOT EXISTS "ManualTransferAccountNumber" text;
ALTER TABLE "settings"."BusinessSettings" ADD COLUMN IF NOT EXISTS "ManualTransferInstructions" text;
ALTER TABLE "settings"."BusinessSettings" ADD COLUMN IF NOT EXISTS "ReservationExpiryMinutes" integer NOT NULL DEFAULT 30;
ALTER TABLE "settings"."BusinessSettings" ADD COLUMN IF NOT EXISTS "PaymentGatewayModuleStatus" text NOT NULL DEFAULT 'NOT_INSTALLED';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='BusinessSettings_PaymentGatewayModuleStatus_check') THEN
    ALTER TABLE "settings"."BusinessSettings" ADD CONSTRAINT "BusinessSettings_PaymentGatewayModuleStatus_check" CHECK ("PaymentGatewayModuleStatus" IN ('NOT_INSTALLED','INSTALLED_NOT_CONFIGURED','CONFIGURED_NOT_READY','ACTIVE','TEMPORARILY_UNAVAILABLE'));
  END IF;
END $$;

-- Payments extensions for manual transfer / order linkage (core; no mandatory gateway FK)
ALTER TABLE "payments"."Payments" ADD COLUMN IF NOT EXISTS "OrderId" text REFERENCES "transactions"."Orders"("Id") ON DELETE SET NULL;
ALTER TABLE "payments"."Payments" ADD COLUMN IF NOT EXISTS "Channel" text;
ALTER TABLE "payments"."Payments" ADD COLUMN IF NOT EXISTS "Currency" text NOT NULL DEFAULT 'IDR';
ALTER TABLE "payments"."Payments" ADD COLUMN IF NOT EXISTS "Provider" text;
ALTER TABLE "payments"."Payments" ADD COLUMN IF NOT EXISTS "ProviderReference" text;
ALTER TABLE "payments"."Payments" ADD COLUMN IF NOT EXISTS "ProofUrl" text;
ALTER TABLE "payments"."Payments" ADD COLUMN IF NOT EXISTS "ProofSubmittedAt" timestamptz;
ALTER TABLE "payments"."Payments" ADD COLUMN IF NOT EXISTS "VerifiedByUserId" text;
ALTER TABLE "payments"."Payments" ADD COLUMN IF NOT EXISTS "VerifiedAt" timestamptz;
ALTER TABLE "payments"."Payments" ADD COLUMN IF NOT EXISTS "VerificationNote" text;
ALTER TABLE "payments"."Payments" ADD COLUMN IF NOT EXISTS "ExpiresAt" timestamptz;
ALTER TABLE "payments"."Payments" ADD COLUMN IF NOT EXISTS "Metadata" jsonb;
CREATE INDEX IF NOT EXISTS "Payments_OrderId_idx" ON "payments"."Payments" ("OrderId");
CREATE INDEX IF NOT EXISTS "Payments_ProviderReference_idx" ON "payments"."Payments" ("ProviderReference");

-- Expand payment status check safely if existing values are compatible.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Payments_Status_check') THEN
    ALTER TABLE "payments"."Payments" DROP CONSTRAINT "Payments_Status_check";
  END IF;
  ALTER TABLE "payments"."Payments" ADD CONSTRAINT "Payments_Status_check" CHECK ("Status" IN ('pending','completed','failed','refunded','expired','partially_refunded'));
END $$;

-- Manual transfer lookup (core payment method; works without gateway)
INSERT INTO "lookups"."PaymentMethods" ("Code","Name","IsActive","RequiresReference","SortOrder","CreatedAt","UpdatedAt")
VALUES ('manual_transfer','Transfer Manual',true,true,4,now(),now())
ON CONFLICT ("Code") DO NOTHING;

-- Idempotency extension
ALTER TABLE "transactions"."CheckoutIdempotency" ADD COLUMN IF NOT EXISTS "OrderId" text REFERENCES "transactions"."Orders"("Id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "CheckoutIdempotency_OrderId_idx" ON "transactions"."CheckoutIdempotency" ("OrderId");
