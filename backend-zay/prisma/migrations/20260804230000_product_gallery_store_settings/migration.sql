-- AlterTable
ALTER TABLE "products" ADD COLUMN "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "store_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "store_name" TEXT NOT NULL DEFAULT 'ZAY',
    "contact_email" TEXT,
    "shipping_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "free_shipping_threshold" DECIMAL(10,2),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- Seed singleton
INSERT INTO "store_settings" ("id", "store_name", "shipping_cost", "updated_at")
VALUES (1, 'ZAY', 0, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
