import { resolveMediaUrl } from './config';
import type { ApiProduct, UiProduct } from './types';

function toNumber(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Mappe un produit API vers la forme utilisée par les vues (UI inchangée). */
export function mapApiProductToUi(product: ApiProduct): UiProduct {
  const variants = product.variants ?? [];
  const sizes = Array.from(new Set(variants.map((v) => v.size)));
  const colorMap = new Map<string, string>();
  for (const v of variants) {
    if (!colorMap.has(v.colorName)) {
      colorMap.set(v.colorName, v.colorHex || '#CCCCCC');
    }
  }

  const cover = resolveMediaUrl(product.image);
  const gallery = (product.images ?? [])
    .map((u) => resolveMediaUrl(u))
    .filter((u) => u && u !== cover);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description ?? undefined,
    price: toNumber(product.price) ?? 0,
    originalPrice: toNumber(product.originalPrice ?? undefined),
    stock: product.stock,
    status: product.status,
    image: cover,
    images: [cover, ...gallery],
    badge: product.badge ?? undefined,
    isNew: product.isNew,
    isPromo: product.isPromo,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId ?? undefined,
    category: product.category?.name ?? '',
    subcategoryName: product.subcategory?.name,
    sizes,
    colors: Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex })),
    variants,
  };
}
