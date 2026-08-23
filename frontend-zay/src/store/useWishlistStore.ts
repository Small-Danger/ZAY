import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAccessToken } from '@/lib/auth/session';
import { toggleWishlist as toggleWishlistApi } from '@/lib/api/wishlist';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface WishlistState {
  items: WishlistItem[];
  toggleItem: (item: WishlistItem) => void;
  isInWishlist: (id: string) => boolean;
  setItems: (items: WishlistItem[]) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggleItem: (newItem) => {
        const items = get().items;
        const index = items.findIndex((item) => item.id === newItem.id);
        if (index !== -1) {
          set({ items: items.filter((item) => item.id !== newItem.id) });
        } else {
          set({ items: [...items, newItem] });
        }

        if (getAccessToken()) {
          void toggleWishlistApi(newItem.id).catch(() => {
            /* local state already updated; sync may fail offline */
          });
        }
      },
      isInWishlist: (id) => get().items.some((item) => item.id === id),
      setItems: (items) => set({ items }),
    }),
    {
      name: 'zay-wishlist-storage',
      skipHydration: true,
    }
  )
);

let wishlistRehydrate: Promise<void> | null = null;

function rehydrateWishlist() {
  if (!wishlistRehydrate) {
    wishlistRehydrate = Promise.resolve(useWishlistStore.persist.rehydrate()).then(
      () => undefined,
    );
  }
  return wishlistRehydrate;
}

/**
 * localStorage n’existe pas au SSR : le cœur reste vide jusqu’après le mount
 * pour que le HTML serveur et le premier rendu client soient identiques.
 */
export function useIsWishlisted(id: string | undefined) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void rehydrateWishlist().then(() => setReady(true));
  }, []);

  const wishlisted = useWishlistStore((s) =>
    Boolean(id && s.items.some((item) => item.id === id)),
  );
  return ready && wishlisted;
}
