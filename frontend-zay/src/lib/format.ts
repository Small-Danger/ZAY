const eurFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

/** Affiche un montant en euros (fr-FR), ex. `24,00 €`. */
export function formatEUR(value: string | number | null | undefined): string {
  const n = typeof value === 'number' ? value : Number(value ?? 0);
  return eurFormatter.format(Number.isFinite(n) ? n : 0);
}
