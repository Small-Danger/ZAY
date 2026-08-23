import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAccessToken } from '@/lib/auth/session';
import { clearRemoteCart, upsertCartItem } from '@/lib/api/cart';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  /** Stock max connu au moment de l’ajout / sync panier */
  maxStock?: number;
}

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  discountAmount: number;
  addItem: (item: CartItem) => { ok: boolean; reason?: string };
  removeItem: (id: string, size: string, color: string) => void;
  updateQuantity: (
    id: string,
    size: string,
    color: string,
    quantity: number,
  ) => { ok: boolean; reason?: string };
  setItemMaxStock: (
    id: string,
    size: string,
    color: string,
    maxStock: number,
  ) => void;
  clearCart: () => void;
  /** Vide le panier affiché sans toucher à la table serveur (déconnexion). */
  dropLocalCart: () => void;
  setItems: (items: CartItem[]) => void;
  setPromo: (code: string, discountAmount: number) => void;
  clearPromo: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  finalPrice: () => number;
}

function clampQty(qty: number, maxStock?: number) {
  const q = Math.max(0, Math.floor(qty));
  if (maxStock == null) return Math.max(1, q);
  if (maxStock <= 0) return 0;
  return Math.min(Math.max(1, q), maxStock);
}

function lineKey(id: string, size: string, color: string) {
  return `${id}::${size.trim().toUpperCase()}::${color.trim().toLowerCase()}`;
}

export function sameLine(
  item: Pick<CartItem, 'id' | 'size' | 'color'>,
  id: string,
  size: string,
  color: string,
) {
  return lineKey(item.id, item.size, item.color) === lineKey(id, size, color);
}

/** Fusionne les doublons (ex. VERT vs Vert) en une seule ligne. */
export function coalesceCartItems(items: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();
  for (const item of items) {
    const size = (item.size || 'Unique').trim().toUpperCase();
    const color = (item.color || 'Standard').trim();
    const key = lineKey(item.id, size, color);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...item, size, color });
      continue;
    }
    const cap = item.maxStock ?? existing.maxStock;
    const quantity = existing.quantity + item.quantity;
    map.set(key, {
      ...existing,
      size,
      color: existing.color,
      quantity: cap != null ? Math.min(quantity, Math.max(cap, 0)) : quantity,
      maxStock: cap,
    });
  }
  return Array.from(map.values()).filter((item) => item.quantity > 0);
}

function persistLine(id: string, size: string, color: string) {
  if (!getAccessToken()) return;
  const line = useCartStore
    .getState()
    .items.find((item) => sameLine(item, id, size, color));
  void upsertCartItem({
    productId: id,
    size,
    color,
    quantity: line?.quantity ?? 0,
  }).catch(() => {
    /* panier local déjà à jour */
  });
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      discountAmount: 0,
      addItem: (newItem) => {
        const maxStock = newItem.maxStock;
        if (maxStock != null && maxStock <= 0) {
          return { ok: false, reason: 'Cette variante est en rupture de stock.' };
        }

        const items = get().items;
        const existingItemIndex = items.findIndex((item) =>
          sameLine(item, newItem.id, newItem.size, newItem.color),
        );

        if (existingItemIndex !== -1) {
          const existing = items[existingItemIndex];
          const cap = maxStock ?? existing.maxStock;
          const nextQty = existing.quantity + newItem.quantity;
          if (cap != null && nextQty > cap) {
            const updatedItems = [...items];
            updatedItems[existingItemIndex] = {
              ...existing,
              quantity: cap,
              maxStock: cap,
            };
            set({ items: updatedItems });
            persistLine(newItem.id, newItem.size, newItem.color);
            return {
              ok: false,
              reason: `Stock limité : ${cap} article${cap > 1 ? 's' : ''} maximum.`,
            };
          }
          const updatedItems = [...items];
          updatedItems[existingItemIndex] = {
            ...existing,
            quantity: nextQty,
            maxStock: cap ?? existing.maxStock,
          };
          set({ items: updatedItems });
          persistLine(newItem.id, newItem.size, newItem.color);
          return { ok: true };
        }

        const quantity = clampQty(newItem.quantity, maxStock);
        if (quantity <= 0) {
          return { ok: false, reason: 'Cette variante est en rupture de stock.' };
        }
        set({
          items: [
            ...items,
            { ...newItem, quantity, maxStock },
          ],
        });
        persistLine(newItem.id, newItem.size, newItem.color);
        return { ok: true };
      },
      removeItem: (id, size, color) => {
        set({
          items: get().items.filter((item) => !sameLine(item, id, size, color)),
        });
        persistLine(id, size, color);
      },
      updateQuantity: (id, size, color, quantity) => {
        const items = get().items;
        const target = items.find((item) => sameLine(item, id, size, color));
        if (!target) return { ok: false, reason: 'Article introuvable' };

        if (quantity <= 0) {
          set({
            items: items.filter((item) => !sameLine(item, id, size, color)),
          });
          persistLine(id, size, color);
          return { ok: true };
        }

        const cap = target.maxStock;
        if (cap != null && quantity > cap) {
          set({
            items: items.map((item) =>
              sameLine(item, id, size, color)
                ? { ...item, quantity: cap }
                : item,
            ),
          });
          persistLine(id, size, color);
          return {
            ok: false,
            reason: `Stock limité : ${cap} article${cap > 1 ? 's' : ''} maximum.`,
          };
        }

        set({
          items: items.map((item) =>
            sameLine(item, id, size, color) ? { ...item, quantity } : item,
          ),
        });
        persistLine(id, size, color);
        return { ok: true };
      },
      setItemMaxStock: (id, size, color, maxStock) => {
        set({
          items: get().items
            .map((item) => {
              if (!sameLine(item, id, size, color)) {
                return item;
              }
              if (maxStock <= 0) {
                return { ...item, maxStock: 0, quantity: 0 };
              }
              return {
                ...item,
                maxStock,
                quantity: Math.min(item.quantity, maxStock),
              };
            })
            .filter((item) => item.quantity > 0),
        });
        persistLine(id, size, color);
      },
      clearCart: () => {
        set({ items: [], promoCode: null, discountAmount: 0 });
        if (getAccessToken()) {
          void clearRemoteCart().catch(() => {
            /* panier local déjà vidé */
          });
        }
      },
      dropLocalCart: () => {
        set({ items: [], promoCode: null, discountAmount: 0 });
      },
      setItems: (items) => set({ items: coalesceCartItems(items) }),
      setPromo: (code, discountAmount) =>
        set({ promoCode: code, discountAmount }),
      clearPromo: () => set({ promoCode: null, discountAmount: 0 }),
      totalItems: () =>
        get().items.reduce((acc, item) => acc + item.quantity, 0),
      totalPrice: () =>
        get().items.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0,
        ),
      finalPrice: () =>
        Math.max(0, get().totalPrice() - get().discountAmount),
    }),
    {
      name: 'zay-cart-storage',
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CartState>;
        return {
          ...current,
          ...p,
          items: coalesceCartItems(p.items ?? current.items),
        };
      },
    },
  ),
);
