import { apiFetch } from './client';
import { resolveMediaUrl } from './config';
import type { CartItem } from '@/store/useCartStore';

export type ApiCartLine = {
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  maxStock: number;
};

export type CartLinePayload = {
  productId: string;
  size: string;
  color: string;
  quantity: number;
};

export function mapApiCartLine(line: ApiCartLine): CartItem {
  return {
    id: line.productId,
    name: line.name,
    price: Number(line.price),
    image: resolveMediaUrl(line.image),
    size: line.size,
    color: line.color,
    quantity: line.quantity,
    maxStock: line.maxStock,
  };
}

export async function fetchCart(): Promise<CartItem[]> {
  const data = await apiFetch<ApiCartLine[]>('/cart');
  return data.map(mapApiCartLine);
}

export async function mergeCart(
  items: CartLinePayload[],
): Promise<CartItem[]> {
  const data = await apiFetch<ApiCartLine[]>('/cart/merge', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
  return data.map(mapApiCartLine);
}

export async function upsertCartItem(
  payload: CartLinePayload,
): Promise<CartItem[]> {
  const data = await apiFetch<ApiCartLine[]>('/cart/item', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.map(mapApiCartLine);
}

export async function clearRemoteCart(): Promise<void> {
  await apiFetch<void>('/cart', { method: 'DELETE' });
}
