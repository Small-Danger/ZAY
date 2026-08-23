
"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { MediaImage } from '@/components/ui/media-image';
import { Footer } from '@/components/layout/Footer';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePromo } from '@/lib/api/promos';
import { applyLiveStockToCart } from '@/lib/cart-stock';
import { cn } from '@/lib/utils';
import { notifyError } from '@/lib/notify';
import { checkoutPath } from '@/lib/auth/session';

export default function PanierPage() {
  const [mounted, setMounted] = useState(false);
  const [caisseHref, setCaisseHref] = useState('/checkout');
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const {
    items,
    removeItem,
    updateQuantity,
    setItemMaxStock,
    totalPrice,
    finalPrice,
    promoCode,
    discountAmount,
    setPromo,
    clearPromo,
  } = useCartStore();

  useEffect(() => {
    setMounted(true);
    setCaisseHref(checkoutPath());
  }, []);

  // Resync stock réel depuis l’API (retire / plafonne si besoin)
  useEffect(() => {
    if (!mounted || items.length === 0) return;
    let cancelled = false;
    (async () => {
      const { removed, reduced } = await applyLiveStockToCart(
        items,
        setItemMaxStock,
      );
      if (cancelled) return;
      if (removed.length > 0) {
        setStockWarning(
          `Retiré pour rupture de stock : ${removed.join(', ')}.`,
        );
      } else if (reduced.length > 0) {
        setStockWarning(
          'Certaines quantités ont été ajustées selon le stock disponible.',
        );
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync on mount / cart id set
  }, [mounted, items.map((i) => `${i.id}:${i.size}:${i.color}`).join('|')]);

  const subtotal = totalPrice();
  const total = finalPrice();
  const installmentPrice = (total / 3).toFixed(2);

  const handleApplyPromo = async () => {
    if (!promoInput.trim() || promoLoading) return;
    setPromoLoading(true);
    try {
      const res = await validatePromo(promoInput.trim(), subtotal);
      setPromo(res.code, res.discountAmount);
      setPromoInput('');
    } catch (err) {
      clearPromo();
      notifyError(err, 'Code promo invalide');
    } finally {
      setPromoLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-zay-main">
        <Header />
        <main className="flex-grow pt-40 pb-24" />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zay-main">
      <Header />
      <main className="flex-grow pt-40 md:pt-52 pb-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 md:mb-12 space-y-3 md:space-y-4 text-center md:text-left">
            <span className="text-primary text-[0.6rem] tracking-[0.4em] font-bold uppercase">Votre Sélection</span>
            <h1 className="text-4xl md:text-7xl font-headline italic font-light">Mon Panier</h1>
          </div>

          {items.length === 0 ? (
            <div className="bg-white p-8 md:p-20 border border-zay-border text-center space-y-6 md:space-y-8 max-w-2xl mx-auto shadow-sm">
              <div className="flex justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-zay-gray rounded-full flex items-center justify-center text-zay-text-muted">
                  <ShoppingBag size={28} strokeWidth={1} />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-headline italic font-bold">Votre panier est vide</h2>
                <p className="text-zay-text-muted tracking-widest text-[0.65rem] md:text-xs italic leading-relaxed md:leading-loose font-light">
                  L'élégance vous attend. Prenez le temps de parcourir nos nouvelles pièces et laissez-vous séduire.
                </p>
              </div>
              <div className="flex justify-center">
                <Button asChild className="w-full md:w-auto bg-zay-text text-white hover:bg-primary px-8 md:px-12 py-6 md:py-7 rounded-full tracking-[0.2em] md:tracking-[0.3em] text-[0.65rem] md:text-[0.7rem] font-bold uppercase transition-all">
                  <Link href="/catalogue">Explorer le catalogue</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
              {/* Articles Area */}
              <div className="lg:col-span-8 space-y-6">
                {stockWarning && (
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest text-primary bg-zay-rose-pale border border-primary/20 px-4 py-3">
                    {stockWarning}
                  </p>
                )}
                <AnimatePresence mode="popLayout">
                  {items.map((item) => {
                    const atMax =
                      item.maxStock != null && item.quantity >= item.maxStock;
                    const lowStock =
                      item.maxStock != null &&
                      item.maxStock > 0 &&
                      item.maxStock <= 3;
                    return (
                    <motion.div 
                      key={`${item.id}-${item.size}-${item.color}`}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white p-4 md:p-6 border border-zay-border flex items-center gap-4 md:gap-6 group hover:shadow-md transition-shadow"
                    >
                      <div className="relative w-20 md:w-24 aspect-[3/4] flex-shrink-0 bg-zay-gray rounded-sm overflow-hidden">
                        <MediaImage
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-grow flex flex-col justify-between h-full py-0.5 md:py-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-[0.7rem] md:text-sm font-bold uppercase tracking-widest text-zay-text leading-tight">{item.name}</h3>
                            <div className="flex flex-wrap gap-2 md:gap-4 mt-1.5 md:mt-2 text-[0.55rem] md:text-[0.65rem] tracking-widest text-zay-text-muted uppercase italic font-bold">
                              <span>T: {item.size}</span>
                              <span className="hidden md:inline opacity-30">•</span>
                              <span>{item.color}</span>
                            </div>
                            {lowStock && (
                              <p className="text-[0.55rem] text-primary font-bold uppercase tracking-widest mt-1">
                                Plus que {item.maxStock} en stock
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs md:text-sm font-bold">€{item.price.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-end mt-4">
                          <div className="flex items-center border border-zay-border bg-zay-main rounded-full scale-90 md:scale-100 origin-left">
                            <button 
                              onClick={() => updateQuantity(item.id, item.size, item.color, Math.max(1, item.quantity - 1))}
                              className="p-2 md:p-3 hover:text-primary transition-colors"
                            >
                              <Minus size={12} strokeWidth={1} />
                            </button>
                            <span className="px-1 md:px-2 text-xs font-bold tabular-nums min-w-[1rem] md:min-w-[1.5rem] text-center">{item.quantity}</span>
                            <button 
                              onClick={() => {
                                const res = updateQuantity(
                                  item.id,
                                  item.size,
                                  item.color,
                                  item.quantity + 1,
                                );
                                if (!res.ok && res.reason) {
                                  setStockWarning(res.reason);
                                }
                              }}
                              disabled={atMax}
                              className={cn(
                                "p-2 md:p-3 hover:text-primary transition-colors",
                                atMax && "opacity-30 cursor-not-allowed",
                              )}
                            >
                              <Plus size={12} strokeWidth={1} />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-4 md:gap-6">
                            <div className="text-right">
                              <p className="text-sm md:text-base font-bold text-primary">€{(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                            <button 
                              onClick={() => removeItem(item.id, item.size, item.color)}
                              className="text-zay-text-muted hover:text-red-500 transition-colors p-1.5"
                              title="Retirer"
                            >
                              <Trash2 size={16} strokeWidth={1} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    );
                  })}
                </AnimatePresence>
                
                <div className="pt-6 md:pt-8 text-center md:text-left">
                  <Link href="/catalogue" className="inline-flex items-center gap-3 text-[0.6rem] md:text-[0.65rem] tracking-[0.2em] md:tracking-[0.3em] font-bold uppercase text-zay-text-muted hover:text-primary transition-colors">
                    <ArrowRight size={14} className="rotate-180" strokeWidth={1} /> Continuer mes achats
                  </Link>
                </div>
              </div>

              {/* Summary Area */}
              <div className="lg:col-span-4">
                <div className="bg-white border border-zay-border p-6 md:p-8 space-y-6 md:space-y-8 sticky top-32 shadow-sm">
                  <h3 className="text-xl md:text-2xl font-headline italic border-b border-zay-border pb-4 font-bold">Récapitulatif</h3>
                  
                  <div className="space-y-5 md:space-y-6">
                    <div className="flex justify-between text-zay-text-muted tracking-[0.1em] text-[0.65rem] md:text-[0.7rem] uppercase font-bold">
                      <span>Sous-total</span>
                      <span className="text-zay-text">€{subtotal.toFixed(2)}</span>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[0.6rem] md:text-[0.65rem] tracking-[0.15em] font-bold uppercase text-zay-text-muted">Code Promo</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="ENTRER LE CODE"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          className="h-10 rounded-none border-zay-border bg-zay-main text-[0.6rem] md:text-[0.65rem] tracking-widest uppercase font-bold"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={promoLoading}
                          onClick={handleApplyPromo}
                          className="h-10 rounded-none px-4 md:px-6 text-[0.55rem] md:text-[0.6rem] font-bold uppercase tracking-widest border-zay-text hover:bg-zay-text hover:text-white"
                        >
                          OK
                        </Button>
                      </div>
                      {promoCode && (
                        <div className="flex justify-between items-center text-[0.6rem] uppercase tracking-widest">
                          <button type="button" onClick={clearPromo} className="text-primary underline font-bold">
                            {promoCode} (−€{discountAmount.toFixed(2)}) · retirer
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between text-zay-text-muted tracking-[0.1em] text-[0.65rem] md:text-[0.7rem] uppercase font-bold">
                      <span>Livraison</span>
                      <span className="text-green-600 font-bold">OFFERTE</span>
                    </div>

                    <div className="pt-4 border-t border-zay-border flex justify-between items-end">
                      <span className="text-[0.65rem] md:text-xs tracking-[0.2em] md:tracking-[0.25em] font-bold uppercase">Total TTC</span>
                      <span className="text-2xl md:text-3xl font-headline font-bold">€{total.toFixed(2)}</span>
                    </div>

                    <div className="bg-zay-main p-4 rounded-sm space-y-1">
                      <div className="flex items-center gap-2 text-primary">
                        <Sparkles size={14} strokeWidth={1} />
                        <p className="text-[0.6rem] md:text-[0.65rem] font-bold uppercase tracking-widest">Paiement 3× sans frais</p>
                      </div>
                      <p className="text-[0.55rem] md:text-[0.6rem] text-zay-text-muted italic font-bold">
                        ou 3 mensualités de <span className="text-zay-text font-bold">€{installmentPrice}</span> avec Klarna ou Alma.
                      </p>
                    </div>
                  </div>

                  <Button 
                    asChild
                    className="w-full bg-primary text-white hover:bg-zay-text py-7 md:py-8 rounded-full tracking-[0.2em] md:tracking-[0.3em] text-[0.65rem] md:text-[0.7rem] font-bold uppercase shadow-xl shadow-primary/20 transition-all"
                  >
                    <Link href={caisseHref}>Passer à la caisse <ArrowRight size={16} className="ml-2" strokeWidth={1} /></Link>
                  </Button>

                  <div className="flex justify-center gap-3 md:gap-4 opacity-50 pt-2 grayscale">
                     <span className="text-[0.5rem] md:text-[0.55rem] font-bold tracking-widest uppercase">Visa · MC · Klarna · Alma</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
