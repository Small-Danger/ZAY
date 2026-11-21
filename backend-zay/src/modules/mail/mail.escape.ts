/** Échappe le HTML pour les valeurs saisies par l’utilisateur. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatEuro(amount: number | string | { toString(): string }): string {
  const n =
    typeof amount === 'number'
      ? amount
      : Number(typeof amount === 'string' ? amount : amount.toString());
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number.isFinite(n) ? n : 0);
}
