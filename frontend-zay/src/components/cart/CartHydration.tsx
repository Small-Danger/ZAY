"use client";

import { useEffect } from "react";
import { getAccessToken } from "@/lib/auth/session";
import { syncCartWithServer } from "@/lib/cart-sync";
import { useCartStore } from "@/store/useCartStore";

/** Une fois le panier local rechargé, aligne sur la base si une session existe. */
export function CartHydration() {
  useEffect(() => {
    const pull = () => {
      if (!getAccessToken()) return;
      void syncCartWithServer("pull").catch(() => {
        /* garde le panier local */
      });
    };

    if (useCartStore.persist.hasHydrated()) {
      pull();
      return;
    }
    return useCartStore.persist.onFinishHydration(pull);
  }, []);
  return null;
}
