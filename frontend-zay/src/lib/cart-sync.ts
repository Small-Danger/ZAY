import { getAccessToken } from '@/lib/auth/session';
import { fetchCart, mergeCart } from '@/lib/api/cart';
import { useCartStore } from '@/store/useCartStore';

export type CartSyncMode = 'merge' | 'pull';

/**
 * merge = connexion / inscription (panier invitée + panier compte).
 * pull  = page déjà connectée (la base gagne, pas de double comptage).
 */
export async function syncCartWithServer(mode: CartSyncMode = 'pull') {
  if (!getAccessToken()) return;
  const local = useCartStore.getState().items;
  const remote =
    mode === 'merge' && local.length > 0
      ? await mergeCart(
          local.map((item) => ({
            productId: item.id,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          })),
        )
      : await fetchCart();
  useCartStore.getState().setItems(remote);
}
