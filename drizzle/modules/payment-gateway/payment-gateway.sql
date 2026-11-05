-- OPTIONAL module. Separate lifecycle from core. Additive only. Apply dev first with explicit approval.
CREATE SCHEMA IF NOT EXISTS "gateway";
CREATE TABLE IF NOT EXISTS "gateway"."PaymentGatewayConfigs" (
  "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "BusinessId" uuid NOT NULL,
  "Provider" text NOT NULL,
  "IsEnabled" boolean NOT NULL DEFAULT false,
  "Mode" text NOT NULL DEFAULT 'sandbox',
  "PublicConfig" jsonb,
  "WebhookSecretRef" text,
  "ApiKeyRef" text,
  "CreatedAt" timestamptz NOT NULL DEFAULT now(),
  "UpdatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PaymentGatewayConfigs_Biz_Provider_key" UNIQUE ("BusinessId","Provider")
);
CREATE TABLE IF NOT EXISTS "gateway"."PaymentGatewayTransactions" (
  "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "OrderId" text,
  "PaymentId" uuid,
  "Provider" text NOT NULL,
  "ProviderReference" text,
  "ProviderSessionId" text,
  "Status" text NOT NULL DEFAULT 'PENDING',
  "Amount" numeric(14,2),
  "Currency" text,
  "RequestPayload" jsonb,
  "ResponsePayload" jsonb,
  "ExpiresAt" timestamptz,
  "CreatedAt" timestamptz NOT NULL DEFAULT now(),
  "UpdatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PaymentGatewayTransactions_ProviderRef_key" UNIQUE ("Provider","ProviderReference")
);
CREATE TABLE IF NOT EXISTS "gateway"."PaymentWebhookEvents" (
  "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "Provider" text NOT NULL,
  "EventId" text,
  "ProviderReference" text,
  "SignatureValid" boolean,
  "Processed" boolean NOT NULL DEFAULT false,
  "ProcessingResult" text,
  "Payload" jsonb,
  "ReceivedAt" timestamptz NOT NULL DEFAULT now(),
  "ProcessedAt" timestamptz,
  CONSTRAINT "PaymentWebhookEvents_Provider_Event_key" UNIQUE ("Provider","EventId")
);
