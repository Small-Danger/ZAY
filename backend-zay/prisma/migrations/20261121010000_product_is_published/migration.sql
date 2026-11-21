-- AlterTable
ALTER TABLE "products" ADD COLUMN "is_published" BOOLEAN NOT NULL DEFAULT false;

-- Preserve live catalogue: existing products stay visible
UPDATE "products" SET "is_published" = true;

-- CreateIndex
CREATE INDEX "products_is_published_idx" ON "products"("is_published");
