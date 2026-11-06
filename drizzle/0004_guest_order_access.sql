-- Phase 8G.1 (ADDITIVE, dev branch): guest order access tokens. Raw token never stored.
CREATE TABLE IF NOT EXISTS "transactions"."GuestOrderAccess" (
  "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "OrderId" text NOT NULL REFERENCES "transactions"."Orders"("Id") ON DELETE CASCADE,
  "TokenHash" text NOT NULL,
  "CreatedAt" timestamptz NOT NULL DEFAULT now(),
  "ExpiresAt" timestamptz,
  "RevokedAt" timestamptz,
  "LastUsedAt" timestamptz,
  CONSTRAINT "GuestOrderAccess_TokenHash_key" UNIQUE ("TokenHash")
);
CREATE INDEX IF NOT EXISTS "GuestOrderAccess_OrderId_idx" ON "transactions"."GuestOrderAccess" ("OrderId");
CREATE INDEX IF NOT EXISTS "GuestOrderAccess_ExpiresAt_idx" ON "transactions"."GuestOrderAccess" ("ExpiresAt");
