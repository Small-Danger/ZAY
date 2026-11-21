/** Limites Klarna « paiement en 3 fois » en France (EUR). */
export const KLARNA_MIN_EUR = 1;
export const KLARNA_MAX_EUR = 1500;

export function isKlarnaEligibleAmount(amountEur: number): boolean {
  return amountEur >= KLARNA_MIN_EUR && amountEur <= KLARNA_MAX_EUR;
}
