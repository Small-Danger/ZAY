-- AlterTable
ALTER TABLE "promo_codes" ADD COLUMN "first_order_only" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "promo_codes" ADD COLUMN "per_user_limit" INTEGER;
