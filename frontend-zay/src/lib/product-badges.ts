/** Aligné sur PRODUCT_BADGES côté API (`product.helpers.ts`). */
export const PRODUCT_BADGES = [
  'NOUVEAU',
  'PROMO',
  'BEST-SELLER',
  'ÉDITION LIMITÉE',
  'DERNIÈRES PIÈCES',
] as const;

export type ProductBadge = (typeof PRODUCT_BADGES)[number];
