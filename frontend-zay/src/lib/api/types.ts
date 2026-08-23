/** Formes renvoyées par NestJS / Prisma (JSON). */

export type ApiCategoryRef = {
  id: string;
  name: string;
};

export type ApiSubcategoryRef = {
  id: string;
  name: string;
  categoryId: string;
};

export type ApiProductVariant = {
  id: string;
  productId: string;
  size: string;
  colorName: string;
  colorHex: string | null;
  sku: string | null;
  stock: number;
};

export type ApiProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: string | number;
  originalPrice: string | number | null;
  stock: number;
  status: string;
  image: string;
  images?: string[];
  badge: string | null;
  isNew: boolean;
  isPromo: boolean;
  categoryId: string;
  subcategoryId: string | null;
  category?: ApiCategoryRef;
  subcategory?: ApiSubcategoryRef | null;
  variants?: ApiProductVariant[];
};

/** Forme attendue par les composants UI existants (ProductCard, catalogue, PDP). */
export type UiProduct = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  status: string;
  image: string;
  /** Couverture + galerie (URLs résolues) */
  images: string[];
  badge?: string;
  isNew: boolean;
  isPromo: boolean;
  categoryId: string;
  subcategoryId?: string;
  /** Nom catégorie — utilisé par filtres / fil d’Ariane */
  category: string;
  subcategoryName?: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  variants: ApiProductVariant[];
};
