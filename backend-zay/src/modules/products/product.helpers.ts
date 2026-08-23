/** Génère un slug URL-safe à partir d’un nom produit. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

/** Statut aligné sur l’admin frontend ZAY. */
export function computeProductStatus(stock: number): string {
  if (stock <= 0) return 'Rupture';
  if (stock <= 5) return 'Stock faible';
  return 'Actif';
}
