
"use client"

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import { checkoutPath } from '@/lib/auth/session';
import { Button } from '@/components/ui/button';
import { MediaImage } from '@/components/ui/media-image';

export const CartDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { items, removeItem, totalPrice } = useCartStore();
  const [caisseHref, setCaisseHref] = useState('/checkout');

  useEffect(() => {
    if (isOpen) setCaisseHref(checkoutPath());
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zay-text/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-[400px] bg-white z-[110] flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-zay-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} className="text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Mon Panier</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:text-primary transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-zay-main rounded-full flex items-center justify-center text-zay-text-muted">
                    <ShoppingBag size={24} />
                  </div>
                  <p className="text-xs tracking-widest italic text-zay-text-muted">Votre panier est vide</p>
                  <Button variant="outline" onClick={onClose} className="rounded-none text-[0.6rem] font-bold uppercase tracking-[0.2em]">Continuer mes achats</Button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-4">
                    <div className="relative w-20 h-28 bg-zay-gray shrink-0">
                      <MediaImage src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-grow space-y-1">
                      <div className="flex justify-between">
                        <h4 className="text-[0.65rem] font-bold uppercase tracking-wider">{item.name}</h4>
                        <button onClick={() => removeItem(item.id, item.size, item.color)} className="text-zay-text-muted hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="text-[0.6rem] text-zay-text-muted italic">Taille: {item.size} • Qté: {item.quantity}</p>
                      <p className="text-[0.65rem] font-bold mt-2">€{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-zay-border bg-zay-main space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest">Total</span>
                  <span className="text-xl font-headline">€{totalPrice().toFixed(2)}</span>
                </div>
                <div className="space-y-3">
                  <Button asChild onClick={onClose} className="w-full bg-primary hover:bg-zay-text text-white py-6 rounded-none text-[0.65rem] tracking-[0.2em] font-bold uppercase">
                    <Link href="/panier">Voir le panier</Link>
                  </Button>
                  <Button asChild onClick={onClose} variant="outline" className="w-full border-zay-text py-6 rounded-none text-[0.65rem] tracking-[0.2em] font-bold uppercase">
                    <Link href={caisseHref}>Passer à la caisse <ArrowRight size={14} className="ml-2" /></Link>
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
