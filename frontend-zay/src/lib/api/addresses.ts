import { apiFetch } from './client';

export type ApiAddress = {
  id: string;
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  isDefault: boolean;
  createdAt?: string;
};

export type AddressPayload = {
  name: string;
  street: string;
  city: string;
  zip: string;
  country?: string;
  isDefault?: boolean;
};

export async function fetchAddresses(): Promise<ApiAddress[]> {
  return apiFetch<ApiAddress[]>('/addresses');
}

export async function createAddress(
  payload: AddressPayload,
): Promise<ApiAddress> {
  return apiFetch<ApiAddress>('/addresses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAddress(
  id: string,
  payload: Partial<AddressPayload>,
): Promise<ApiAddress> {
  return apiFetch<ApiAddress>(`/addresses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function setDefaultAddress(id: string): Promise<ApiAddress> {
  return apiFetch<ApiAddress>(`/addresses/${id}/default`, {
    method: 'PATCH',
  });
}

export async function deleteAddress(id: string): Promise<void> {
  await apiFetch<void>(`/addresses/${id}`, { method: 'DELETE' });
}
