import type { ApiProductVariant, UiProduct } from '@/lib/api/types';

/** Stock d’une variante taille+couleur (0 si absente). */
export function getVariantStock(
  product: Pick<UiProduct, 'variants' | 'stock'>,
  size?: string | null,
  color?: string | null,
): number {
  const variants = product.variants ?? [];
  if (variants.length === 0) {
    return Math.max(0, product.stock ?? 0);
  }

  const sizeNorm = size?.trim().toUpperCase() || null;
  const colorNorm = color?.trim().toLowerCase() || null;

  const match = variants.find((v) => {
    const sizeOk = !sizeNorm || v.size.toUpperCase() === sizeNorm;
    const colorOk =
      !colorNorm || v.colorName.toLowerCase() === colorNorm;
    return sizeOk && colorOk;
  });

  return match ? Math.max(0, match.stock) : 0;
}

/** Stock agrégé d’une taille (toutes couleurs). */
export function getSizeTotalStock(
  product: Pick<UiProduct, 'variants' | 'stock'>,
  size: string,
): number {
  const variants = product.variants ?? [];
  if (variants.length === 0) return Math.max(0, product.stock ?? 0);
  const sizeNorm = size.trim().toUpperCase();
  return variants
    .filter((v) => v.size.toUpperCase() === sizeNorm)
    .reduce((sum, v) => sum + Math.max(0, v.stock), 0);
}

/** Stock d’une couleur (toutes tailles, ou filtrée par taille). */
export function getColorTotalStock(
  product: Pick<UiProduct, 'variants' | 'stock'>,
  colorName: string,
  size?: string | null,
): number {
  const variants = product.variants ?? [];
  if (variants.length === 0) return Math.max(0, product.stock ?? 0);
  const colorNorm = colorName.trim().toLowerCase();
  const sizeNorm = size?.trim().toUpperCase() || null;
  return variants
    .filter((v) => {
      if (v.colorName.toLowerCase() !== colorNorm) return false;
      if (sizeNorm && v.size.toUpperCase() !== sizeNorm) return false;
      return true;
    })
    .reduce((sum, v) => sum + Math.max(0, v.stock), 0);
}

/** Map taille → stock total (pour ProductCard). */
export function sizeStockMap(
  product: Pick<UiProduct, 'variants' | 'stock' | 'sizes'>,
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const size of product.sizes ?? []) {
    map[size] = getSizeTotalStock(product, size);
  }
  return map;
}

export function isProductFullyOutOfStock(
  product: Pick<UiProduct, 'variants' | 'stock'>,
): boolean {
  const variants = product.variants ?? [];
  if (variants.length === 0) return (product.stock ?? 0) <= 0;
  return variants.every((v) => v.stock <= 0);
}

export function findVariant(
  variants: ApiProductVariant[],
  size?: string | null,
  color?: string | null,
): ApiProductVariant | undefined {
  const sizeNorm = size?.trim().toUpperCase() || null;
  const colorNorm = color?.trim().toLowerCase() || null;
  return variants.find((v) => {
    const sizeOk = !sizeNorm || v.size.toUpperCase() === sizeNorm;
    const colorOk =
      !colorNorm || v.colorName.toLowerCase() === colorNorm;
    return sizeOk && colorOk;
  });
}
