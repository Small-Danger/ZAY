import { apiFetch } from './client';

export type PromoType = 'PERCENTAGE' | 'AMOUNT';

export type ApiPromo = {
  id: string;
  code: string;
  type: PromoType;
  value: string | number;
  expiresAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  active: boolean;
};

export type CreatePromoPayload = {
  code: string;
  type: PromoType;
  value: number;
  expiresAt?: string | null;
  usageLimit?: number | null;
  active?: boolean;
};

export type UpdatePromoPayload = Partial<CreatePromoPayload>;

export type ValidatePromoResult = {
  valid: boolean;
  code: string;
  type: PromoType;
  value: number;
  discountAmount: number;
};

export async function fetchPromos(): Promise<ApiPromo[]> {
  return apiFetch<ApiPromo[]>('/promos');
}

export async function createPromo(
  payload: CreatePromoPayload,
): Promise<ApiPromo> {
  return apiFetch<ApiPromo>('/promos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePromo(
  id: string,
  payload: UpdatePromoPayload,
): Promise<ApiPromo> {
  return apiFetch<ApiPromo>(`/promos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deletePromo(id: string): Promise<void> {
  await apiFetch<void>(`/promos/${id}`, { method: 'DELETE' });
}

export async function validatePromo(
  code: string,
  subtotal: number,
): Promise<ValidatePromoResult> {
  return apiFetch<ValidatePromoResult>('/promos/validate', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal }),
  });
}

export function formatPromoValue(promo: ApiPromo): string {
  const n = typeof promo.value === 'number' ? promo.value : Number(promo.value);
  return promo.type === 'PERCENTAGE' ? `-${n}%` : `-${n.toFixed(2)}€`;
}

export function formatPromoExpiration(expiresAt: string | null): string {
  if (!expiresAt) return 'Indéfinie';
  try {
    return new Date(expiresAt).toLocaleDateString('fr-FR');
  } catch {
    return expiresAt;
  }
}
