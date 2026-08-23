"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { MediaImage } from '@/components/ui/media-image';
import { Footer } from '@/components/layout/Footer';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, ArrowRight, ChevronLeft, CreditCard, ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createOrder, type ApiPaymentMethod } from '@/lib/api/orders';
import { fetchAddresses } from '@/lib/api/addresses';
import { fetchMe } from '@/lib/api/auth';
import { applyLiveStockToCart } from '@/lib/cart-stock';
import { getAccessToken, LOGIN_THEN_CHECKOUT } from '@/lib/auth/session';
import { cn } from '@/lib/utils';
import { notify, notifyError } from '@/lib/notify';

const STEPS = [
  { id: 1, name: 'Livraison' },
  { id: 2, name: 'Paiement' },
  { id: 3, name: 'Confirmation' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [saving, setSaving] = useState(false);
  const {
    items,
    totalPrice,
    finalPrice,
    promoCode,
    discountAmount,
    clearCart,
    setItemMaxStock,
  } = useCartStore();

  const [shipping, setShipping] = useState({
    firstName: '',
    lastName: '',
    addressLine: '',
    city: '',
    postalCode: '',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<ApiPaymentMethod>('CARD');

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace(LOGIN_THEN_CHECKOUT);
      return;
    }
    setAuthed(true);
    setMounted(true);
    if (new URLSearchParams(window.location.search).get('canceled') === '1') {
      notify('Paiement annulé. Votre panier est intact.');
    }
  }, [router]);

  useEffect(() => {
    if (!mounted || !authed) return;
    if (items.length === 0) {
      router.replace('/panier');
    }
  }, [mounted, authed, items.length, router]);

  useEffect(() => {
    if (!mounted || !authed || items.length === 0) return;
    let cancelled = false;
    (async () => {
      const snapshot = useCartStore.getState().items;
      const { removed, reduced } = await applyLiveStockToCart(
        snapshot,
        setItemMaxStock,
      );
      if (cancelled) return;
      if (removed.length > 0) {
        notify(
          `Retiré pour rupture de stock : ${removed.join(', ')}. Choisissez une autre taille.`,
        );
      } else if (reduced.length > 0) {
        notify('Quantités ajustées selon le stock disponible.');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, items.map((i) => `${i.id}:${i.size}:${i.color}`).join('|')]);

  useEffect(() => {
    if (!mounted || !authed || !getAccessToken()) return;
    let cancelled = false;
    (async () => {
      try {
        const [me, addresses] = await Promise.all([
          fetchMe().catch(() => null),
          fetchAddresses().catch(() => []),
        ]);
        if (cancelled) return;
        const def = addresses.find((a) => a.isDefault) ?? addresses[0];
        setShipping((prev) => ({
          firstName: prev.firstName || me?.firstName || '',
          lastName: prev.lastName || me?.lastName || '',
          phone: prev.phone || me?.phone || '',
          addressLine: prev.addressLine || def?.street || '',
          city: prev.city || def?.city || '',
          postalCode: prev.postalCode || def?.zip || '',
        }));
      } catch {
        // ignore prefill errors
      }
    })();
    return () => { cancelled = true; };
  }, [mounted]);

  const handleNextFromShipping = () => {
    if (
      !shipping.firstName.trim() ||
      !shipping.lastName.trim() ||
      !shipping.addressLine.trim() ||
      !shipping.city.trim() ||
      !shipping.postalCode.trim()
    ) {
      notify('Merci de remplir l’adresse de livraison.');
      return;
    }
    setStep(2);
  };

  const handleConfirmOrder = async () => {
    if (!getAccessToken()) {
      notify('Connectez-vous pour finaliser la commande.');
      router.replace(LOGIN_THEN_CHECKOUT);
      return;
    }
    if (items.length === 0 || saving) return;

    setSaving(true);
    try {
      const { removed } = await applyLiveStockToCart(
        useCartStore.getState().items,
        setItemMaxStock,
      );
      const liveItems = useCartStore.getState().items;
      if (removed.length > 0) {
        notify(
          `Retiré pour rupture de stock : ${removed.join(', ')}.`,
        );
      }
      if (liveItems.length === 0) {
        notify('Plus d’article disponible. Choisissez une autre taille.');
        router.replace('/panier');
        return;
      }

      const order = await createOrder({
        items: liveItems.map((item) => ({
          productId: item.id,
          size: (item.size || 'Unique').trim(),
          color: (item.color || 'Standard').trim(),
          quantity: item.quantity,
        })),
        shipping: {
          firstName: shipping.firstName.trim(),
          lastName: shipping.lastName.trim(),
          phone: shipping.phone.trim() || undefined,
          addressLine: shipping.addressLine.trim(),
          city: shipping.city.trim(),
          postalCode: shipping.postalCode.trim(),
          country: 'France',
        },
        paymentMethod,
        promoCode: promoCode || undefined,
      });
      if (order.checkoutUrl) {
        window.location.href = order.checkoutUrl;
        return;
      }
      clearCart();
      router.push(`/commande/confirmation?number=${encodeURIComponent(order.number)}`);
    } catch (err) {
      notifyError(err, 'Erreur commande');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !authed) {
    return (
      <div className="min-h-screen flex flex-col bg-zay-main">
        <Header />
        <main className="flex-grow pt-40 pb-24" />
        <Footer />
      </div>
    );
  }

  const paymentLabel =
    paymentMethod === 'KLARNA' ? 'Klarna (3× sans frais)' : 'Carte Bancaire';

  return (
    <div className="min-h-screen flex flex-col bg-zay-main">
      <Header />
      <main className="flex-grow pt-40 md:pt-52 pb-24">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Stepper Indicator */}
          <div className="flex items-center justify-center mb-16">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-[0.7rem] font-light transition-all',
                      step >= s.id ? 'bg-primary text-white' : 'bg-zay-gray text-zay-text-muted',
                    )}
                  >
                    {step > s.id ? <Check size={16} strokeWidth={1} /> : s.id}
                  </div>
                  <span
                    className={cn(
                      'text-[0.6rem] tracking-[0.2em] font-light uppercase mt-2',
                      step >= s.id ? 'text-primary' : 'text-zay-text-muted',
                    )}
                  >
                    {s.name}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-16 md:w-24 h-px mb-6',
                      step > s.id ? 'bg-primary' : 'bg-zay-border',
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start">
            
            {/* Form Section */}
            <div className="lg:col-span-7 bg-white p-8 md:p-12 border border-zay-border shadow-sm min-h-[500px]">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-8"
                  >
                    <h2 className="text-3xl font-headline italic font-light">Adresse de Livraison</h2>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-light text-zay-text-muted">Prénom</Label>
                        <Input
                          required
                          value={shipping.firstName}
                          onChange={(e) => setShipping({ ...shipping, firstName: e.target.value })}
                          placeholder="Jane"
                          className="h-12 border-zay-border rounded-none font-light"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-light text-zay-text-muted">Nom</Label>
                        <Input
                          required
                          value={shipping.lastName}
                          onChange={(e) => setShipping({ ...shipping, lastName: e.target.value })}
                          placeholder="Doe"
                          className="h-12 border-zay-border rounded-none font-light"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-light text-zay-text-muted">Adresse</Label>
                      <Input
                        required
                        value={shipping.addressLine}
                        onChange={(e) => setShipping({ ...shipping, addressLine: e.target.value })}
                        placeholder="Numéro et nom de rue"
                        className="h-12 border-zay-border rounded-none font-light"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-light text-zay-text-muted">Ville</Label>
                        <Input
                          required
                          value={shipping.city}
                          onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                          placeholder="Paris"
                          className="h-12 border-zay-border rounded-none font-light"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-light text-zay-text-muted">Code Postal</Label>
                        <Input
                          required
                          value={shipping.postalCode}
                          onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                          placeholder="75000"
                          className="h-12 border-zay-border rounded-none font-light"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-light text-zay-text-muted">Téléphone</Label>
                      <Input
                        type="tel"
                        value={shipping.phone}
                        onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                        className="h-12 border-zay-border rounded-none font-light"
                      />
                    </div>
                    <Button onClick={handleNextFromShipping} className="w-full bg-primary hover:bg-zay-text text-white py-7 rounded-none text-[0.7rem] tracking-[0.3em] font-light uppercase mt-8">
                      Étape Suivante <ArrowRight size={16} className="ml-2" strokeWidth={1} />
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-8"
                  >
                    <h2 className="text-3xl font-headline italic font-light">Méthode de Paiement</h2>
                    <RadioGroup
                      value={paymentMethod === 'CARD' ? 'card' : 'klarna'}
                      onValueChange={(v) => setPaymentMethod(v === 'klarna' ? 'KLARNA' : 'CARD')}
                      className="space-y-4"
                    >
                      <div className="flex items-center space-x-4 border border-zay-border p-6 rounded-none hover:border-primary transition-colors cursor-pointer">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex-grow flex items-center justify-between cursor-pointer">
                          <span className="text-sm font-light uppercase tracking-widest">Carte Bancaire</span>
                          <CreditCard className="text-zay-text-muted" size={20} strokeWidth={1} />
                        </Label>
                      </div>
                      <div className="flex items-center space-x-4 border border-zay-border p-6 rounded-none hover:border-primary transition-colors cursor-pointer">
                        <RadioGroupItem value="klarna" id="klarna" />
                        <Label htmlFor="klarna" className="flex-grow flex items-center justify-between cursor-pointer">
                          <span className="text-sm font-light uppercase tracking-widest">Klarna (3× sans frais)</span>
                          <span className="text-pink-500 font-black italic text-lg tracking-tighter">Klarna.</span>
                        </Label>
                      </div>
                    </RadioGroup>
                    <div className="flex gap-4 mt-12">
                      <Button variant="outline" onClick={() => setStep(1)} className="flex-1 py-7 rounded-none text-[0.7rem] tracking-[0.2em] font-light uppercase border-zay-border">
                        <ChevronLeft size={16} className="mr-2" strokeWidth={1} /> Retour
                      </Button>
                      <Button onClick={() => setStep(3)} className="flex-[2] bg-primary hover:bg-zay-text text-white py-7 rounded-none text-[0.7rem] tracking-[0.3em] font-light uppercase">
                        Vérifier la commande <ArrowRight size={16} className="ml-2" strokeWidth={1} />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-8"
                  >
                    <div className="text-center space-y-4 pb-8 border-b border-zay-border">
                       <ShieldCheck className="mx-auto text-green-500 w-16 h-16" strokeWidth={1} />
                       <h2 className="text-3xl font-headline italic font-light">Dernière vérification</h2>
                       <p className="text-zay-text-muted text-xs italic font-light">Veuillez confirmer vos informations avant de procéder au paiement sécurisé.</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <h4 className="text-[0.6rem] tracking-[0.2em] font-light uppercase text-zay-text-muted">Expédition</h4>
                          <p className="text-sm italic font-light">
                            {shipping.firstName} {shipping.lastName}<br />
                            {shipping.addressLine}, {shipping.postalCode} {shipping.city}
                          </p>
                       </div>
                       <div className="space-y-2">
                          <h4 className="text-[0.6rem] tracking-[0.2em] font-light uppercase text-zay-text-muted">Paiement</h4>
                          <p className="text-sm italic font-light">{paymentLabel}</p>
                       </div>
                    </div>

                    <p className="text-[0.65rem] text-zay-text-muted italic font-light leading-relaxed pt-4">
                      En confirmant, vous acceptez nos{' '}
                      <Link href="/cgv" className="underline underline-offset-2 hover:text-primary transition-colors">
                        conditions générales de vente
                      </Link>
                      {' '}et notre{' '}
                      <Link href="/confidentialite" className="underline underline-offset-2 hover:text-primary transition-colors">
                        politique de confidentialité
                      </Link>
                      .
                    </p>

                    <div className="flex gap-4 pt-4">
                      <Button variant="outline" onClick={() => setStep(2)} className="flex-1 py-7 rounded-none text-[0.7rem] tracking-[0.2em] font-light uppercase border-zay-border">
                        Modifier
                      </Button>
                      <Button disabled={saving} onClick={handleConfirmOrder} className="flex-[2] bg-zay-text hover:bg-primary text-white py-7 rounded-none text-[0.7rem] tracking-[0.3em] font-light uppercase">
                        {saving ? <Loader2 className="animate-spin" /> : 'Confirmer et Payer'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-zay-border p-8 sticky top-32 space-y-8 shadow-sm">
                <h3 className="text-xl font-headline italic border-b border-zay-border pb-4 font-light">Ma Commande</h3>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-4">
                      <div className="w-16 h-20 relative bg-zay-gray flex-shrink-0">
                        <MediaImage src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-grow py-1 space-y-1">
                        <h5 className="text-[0.65rem] font-light uppercase tracking-wider">{item.name}</h5>
                        <p className="text-[0.6rem] text-zay-text-muted italic font-light">Taille: {item.size} • Qté: {item.quantity}</p>
                        <p className="text-[0.65rem] font-light">€{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-6 border-t border-zay-border">
                  <div className="flex justify-between text-xs tracking-widest text-zay-text-muted uppercase font-light">
                    <span>Sous-total</span>
                    <span>€{totalPrice().toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-xs tracking-widest text-primary uppercase font-light">
                      <span>Promo {promoCode}</span>
                      <span>−€{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs tracking-widest text-zay-text-muted uppercase font-light">
                    <span>Livraison</span>
                    <span className="text-green-600">Gratuite</span>
                  </div>
                  <div className="flex justify-between items-end pt-4 border-t border-zay-border">
                    <span className="text-xs tracking-[0.2em] font-light uppercase">Total</span>
                    <span className="text-2xl font-headline font-light">€{finalPrice().toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col items-center gap-4 text-center">
                   <p className="text-[0.55rem] text-zay-text-muted tracking-widest italic leading-loose font-light">
                    Paiement 100% sécurisé via nos partenaires bancaires certifiés SSL.
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
