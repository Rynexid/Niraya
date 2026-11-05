-- Phase 8 additive (dev branch): allow QR/manual payments to exist before legacy financial Transaction finalization.
-- POS Phase 7 continues to set TransactionId for completed POS checkouts.
ALTER TABLE "payments"."Payments" ALTER COLUMN "TransactionId" DROP NOT NULL;
