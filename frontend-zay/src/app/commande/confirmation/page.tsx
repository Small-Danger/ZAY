"use client"

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, ShoppingBag, Truck, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { confirmStripePayment, fetchOrder } from '@/lib/api/orders';
import { useCartStore } from '@/store/useCartStore';
import { getAccessToken } from '@/lib/auth/session';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const number = searchParams.get('number') || 'ZAY-XXXXX';
  const sessionId = searchParams.get('session_id');
  const clearCart = useCartStore((s) => s.clearCart);
  const [paid, setPaid] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let isPaid = false;
      if (sessionId && getAccessToken()) {
        try {
          const order = await confirmStripePayment(sessionId);
          isPaid = order.status === 'PAID';
        } catch {
          /* le webhook peut déjà avoir marqué PAID */
        }
      }
      if (!isPaid) {
        try {
          const order = await fetchOrder(number);
          isPaid = order.status === 'PAID';
        } catch {
          isPaid = false;
        }
      }
      if (cancelled) return;
      setPaid(isPaid);
      if (isPaid) clearCart();
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, number, clearCart]);

  if (paid === null) {
    return (
      <div className="w-full max-w-lg bg-white p-12 text-center border border-zay-border shadow-sm">
        <p className="text-sm italic text-zay-text-muted">Vérification du paiement…</p>
      </div>
    );
  }

  if (!paid) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white p-12 text-center space-y-8 border border-zay-border shadow-sm"
      >
        <div className="mx-auto w-20 h-20 flex items-center justify-center bg-zay-gray rounded-full text-zay-text-muted">
          <Clock size={36} strokeWidth={1.5} />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-headline italic">
            Paiement en cours de vérification
          </h1>
          <p className="text-zay-text-muted text-xs tracking-widest uppercase font-bold">
            Numéro de commande: #{number}
          </p>
          <p className="text-sm italic tracking-wide max-w-sm mx-auto leading-relaxed">
            Votre paiement est en cours de confirmation. Vous pourrez suivre
            l&apos;état de la commande dès qu&apos;il sera validé.
          </p>
        </div>
        <div className="grid gap-4 pt-6">
          <Button
            asChild
            className="w-full bg-primary hover:bg-zay-text text-white py-8 rounded-none text-[0.65rem] tracking-[0.3em] font-bold uppercase transition-all"
          >
            <Link href={`/commande/suivi?id=${encodeURIComponent(number)}`}>
              <Truck className="mr-2" size={16} /> Suivre ma commande
            </Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-lg bg-white p-12 text-center space-y-8 border border-zay-border shadow-sm"
    >
      <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-full h-full bg-green-500 rounded-full flex items-center justify-center text-white"
        >
          <Check size={40} strokeWidth={3} />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-green-500 rounded-full -z-10"
        />
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl font-headline italic">Commande confirmée !</h1>
        <p className="text-zay-text-muted text-xs tracking-widest uppercase font-bold">
          Numéro de commande: #{number}
        </p>
        <p className="text-sm italic tracking-wide max-w-sm mx-auto leading-relaxed">
          Merci pour votre confiance. Un e-mail de confirmation vous a été
          envoyé. Nous préparons votre colis avec le plus grand soin.
        </p>
      </div>

      <div className="grid gap-4 pt-6">
        <Button
          asChild
          className="w-full bg-primary hover:bg-zay-text text-white py-8 rounded-none text-[0.65rem] tracking-[0.3em] font-bold uppercase transition-all"
        >
          <Link href={`/commande/suivi?id=${encodeURIComponent(number)}`}>
            <Truck className="mr-2" size={16} /> Suivre ma livraison
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="w-full border-zay-border py-8 rounded-none text-[0.65rem] tracking-[0.2em] font-bold uppercase"
        >
          <Link href="/catalogue">
            <ShoppingBag className="mr-2" size={16} /> Continuer mes achats{' '}
            <ArrowRight className="ml-2" size={14} />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zay-main">
      <Header />
      <main className="flex-grow flex items-center justify-center pt-32 pb-24 px-4">
        <Suspense
          fallback={
            <div className="text-sm italic text-zay-text-muted">Chargement…</div>
          }
        >
          <ConfirmationContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
