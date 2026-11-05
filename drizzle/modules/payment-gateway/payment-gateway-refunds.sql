-- OPTIONAL module refunds. Additive only.
CREATE TABLE IF NOT EXISTS "gateway"."PaymentGatewayRefunds" (
  "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "RefundId" uuid,
  "Provider" text NOT NULL,
  "ProviderRefundReference" text,
  "Status" text NOT NULL DEFAULT 'PENDING',
  "Amount" numeric(14,2),
  "Payload" jsonb,
  "CreatedAt" timestamptz NOT NULL DEFAULT now(),
  "UpdatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PaymentGatewayRefunds_ProviderRef_key" UNIQUE ("Provider","ProviderRefundReference")
);
