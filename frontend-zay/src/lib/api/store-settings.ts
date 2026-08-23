import { apiFetch } from './client';

export type StoreSettings = {
  id: number;
  storeName: string;
  contactEmail: string | null;
  shippingCost: string | number;
  freeShippingThreshold: string | number | null;
  updatedAt?: string;
};

export type UpdateStoreSettingsPayload = {
  storeName?: string;
  contactEmail?: string | null;
  shippingCost?: number;
  freeShippingThreshold?: number | null;
};

export async function fetchStoreSettings(): Promise<StoreSettings> {
  return apiFetch<StoreSettings>('/admin/store-settings');
}

export async function updateStoreSettings(
  payload: UpdateStoreSettingsPayload,
): Promise<StoreSettings> {
  return apiFetch<StoreSettings>('/admin/store-settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
