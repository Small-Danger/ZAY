import { apiFetch } from './client';
import { mapApiProductToUi } from './mappers';
import type { ApiProduct, UiProduct } from './types';

export async function fetchWishlist(): Promise<UiProduct[]> {
  const data = await apiFetch<ApiProduct[]>('/wishlist');
  return data.map(mapApiProductToUi);
}

export async function toggleWishlist(
  productId: string,
): Promise<{ inWishlist: boolean; productId: string }> {
  return apiFetch('/wishlist/toggle', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await apiFetch<void>(`/wishlist/${productId}`, { method: 'DELETE' });
}
