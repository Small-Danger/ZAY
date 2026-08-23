"use client"

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useWishlistStore } from '@/store/useWishlistStore';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Heart, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWishlist } from '@/lib/api/wishlist';
import { getAccessToken } from '@/lib/auth/session';

export default function FavoritesPage() {
  const { items, setItems } = useWishlistStore();

  useEffect(() => {
    void useWishlistStore.persist.rehydrate();
    if (!getAccessToken()) return;
    void fetchWishlist()
      .then((products) => {
        setItems(
          products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image,
          })),
        );
      })
      .catch(() => {
        /* keep local wishlist */
      });
  }, [setItems]);

  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-headline italic">Mes Favoris</h1>
        <p className="text-zay-text-muted tracking-widest text-xs italic">Votre sélection personnalisée</p>
      </div>

      <AnimatePresence mode="wait">
        {items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-6"
          >
            <div className="w-20 h-20 bg-zay-rose-pale rounded-full flex items-center justify-center text-primary">
              <Heart size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-headline italic">Votre liste de souhaits est vide</h2>
              <p className="text-zay-text-muted tracking-widest text-xs italic max-w-xs">Enregistrez vos pièces favorites pour les retrouver plus tard.</p>
            </div>
            <Button asChild className="bg-primary hover:bg-zay-text text-white px-10 py-6 rounded-full text-[0.65rem] tracking-[0.3em] font-bold uppercase">
              <Link href="/catalogue">Découvrir la collection</Link>
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-x-10 gap-y-16"
          >
            {items.map((item) => (
              <ProductCard 
                key={item.id}
                id={item.id}
                name={item.name}
                price={item.price}
                image={item.image}
                category="Sélection"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {items.length > 0 && (
        <div className="pt-12 border-t border-zay-border flex justify-center">
          <Link href="/catalogue" className="text-[0.6rem] tracking-[0.4em] font-bold uppercase text-zay-text-muted hover:text-primary transition-colors flex items-center gap-4 group">
            Continuer mon shopping <ArrowRight size={16} className="transition-transform group-hover:translate-x-2" />
          </Link>
        </div>
      )}
    </div>
  );
}
