import { fetchProduct } from '@/lib/api/products';
import { getVariantStock } from '@/lib/product-stock';
import { coalesceCartItems, useCartStore } from '@/store/useCartStore';
import type { CartItem } from '@/store/useCartStore';

export async function applyLiveStockToCart(
  items: CartItem[],
  setItemMaxStock: (
    id: string,
    size: string,
    color: string,
    maxStock: number,
  ) => void,
): Promise<{ removed: string[]; reduced: string[] }> {
  const coalesced = coalesceCartItems(items);
  if (
    coalesced.length !== items.length ||
    coalesced.some((line, i) => line.quantity !== items[i]?.quantity)
  ) {
    useCartStore.setState({ items: coalesced });
  }
  const liveItems = useCartStore.getState().items;

  const uniqueIds = Array.from(new Set(liveItems.map((i) => i.id)));
  const products = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        return await fetchProduct(id);
      } catch {
        return null;
      }
    }),
  );
  const byId = new Map(products.filter(Boolean).map((p) => [p!.id, p!]));
  const removed: string[] = [];
  const reduced: string[] = [];

  for (const item of liveItems) {
    const product = byId.get(item.id);
    const stock = product
      ? getVariantStock(product, item.size, item.color)
      : 0;
    const label = `${item.name} (${item.size}/${item.color})`;

    if (stock <= 0) {
      setItemMaxStock(item.id, item.size, item.color, 0);
      removed.push(label);
      continue;
    }
    if (item.quantity > stock) {
      setItemMaxStock(item.id, item.size, item.color, stock);
      reduced.push(label);
      continue;
    }
    if (item.maxStock !== stock) {
      setItemMaxStock(item.id, item.size, item.color, stock);
    }
  }

  return { removed, reduced };
}
