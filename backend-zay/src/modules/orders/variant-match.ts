const GENERIC_COLORS = new Set([
  '',
  'standard',
  'default',
  'unique',
  'n/a',
  'na',
  '-',
]);

const GENERIC_SIZES = new Set([
  '',
  'UNIQUE',
  'OS',
  'ONESIZE',
  'ONE SIZE',
  'TU',
  'U',
]);

export type MatchableVariant = {
  id: string;
  size: string;
  colorName: string;
  stock: number;
};

function normSize(value: string) {
  return value.trim().toUpperCase();
}

function normColor(value: string) {
  return value.trim().toLowerCase();
}

function firstAvailable<T extends { stock: number }>(list: T[]): T | undefined {
  return list.find((v) => v.stock > 0);
}

/** Associe un article panier à une variante, même si la couleur vaut « Standard ». */
export function resolveProductVariant(
  variants: MatchableVariant[],
  sizeRaw: string,
  colorRaw: string,
): MatchableVariant | null {
  if (variants.length === 0) return null;

  const size = normSize(sizeRaw);
  const color = normColor(colorRaw);

  const exact = variants.find(
    (v) => normSize(v.size) === size && normColor(v.colorName) === color,
  );
  if (exact) return exact;

  const bySize = variants.filter((v) => normSize(v.size) === size);
  const byColor = variants.filter((v) => normColor(v.colorName) === color);

  if (GENERIC_COLORS.has(color) && bySize.length > 0) {
    return firstAvailable(bySize) ?? null;
  }
  if (GENERIC_SIZES.has(size) && byColor.length > 0) {
    return firstAvailable(byColor) ?? null;
  }
  if (bySize.length === 1 && bySize[0].stock > 0) {
    return bySize[0];
  }
  if (GENERIC_COLORS.has(color) || GENERIC_SIZES.has(size)) {
    return firstAvailable(variants) ?? null;
  }

  return null;
}

export function formatAvailableVariants(variants: MatchableVariant[]): string {
  const inStock = variants.filter((v) => v.stock > 0);
  const source = inStock.length > 0 ? inStock : variants;
  return source.map((v) => `${v.size} ${v.colorName}`).join(', ');
}
