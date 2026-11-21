-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "confirmation_email_sent_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipped_email_sent_at" TIMESTAMP(3);
