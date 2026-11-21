-- AlterTable
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "trade_name" TEXT;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "vat_franchise" BOOLEAN NOT NULL DEFAULT true;
