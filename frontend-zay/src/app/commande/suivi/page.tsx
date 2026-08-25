"use client"

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Truck, Package, CheckCircle2, MapPin, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchOrder, ORDER_STATUS_LABEL, type ApiOrder, type ApiOrderStatus } from '@/lib/api/orders';
import { getAccessToken } from '@/lib/auth/session';
import { ZayBusyOverlay } from '@/components/ui/zay-busy-overlay';

const STEP_DEFS = [
  { id: 1, label: 'Commande reçue', icon: Box, statuses: ['PENDING', 'PAID', 'PREPARING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'] as ApiOrderStatus[] },
  { id: 2, label: 'En préparation', icon: Package, statuses: ['PREPARING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'] as ApiOrderStatus[] },
  { id: 3, label: 'Expédiée', icon: Truck, statuses: ['SHIPPED', 'IN_TRANSIT', 'DELIVERED'] as ApiOrderStatus[] },
  { id: 4, label: 'En transit', icon: MapPin, statuses: ['IN_TRANSIT', 'DELIVERED'] as ApiOrderStatus[] },
  { id: 5, label: 'Livrée', icon: CheckCircle2, statuses: ['DELIVERED'] as ApiOrderStatus[] },
];

function statusRank(status: ApiOrderStatus): number {
  switch (status) {
    case 'PENDING':
    case 'PAID':
      return 1;
    case 'PREPARING':
      return 2;
    case 'SHIPPED':
      return 3;
    case 'IN_TRANSIT':
      return 4;
    case 'DELIVERED':
      return 5;
    default:
      return 0;
  }
}

function formatStepDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id') || '';
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace(`/connexion`);
      return;
    }
    if (!orderId) {
      setLoading(false);
      setError('Numéro de commande manquant.');
      return;
    }

    setLoading(true);
    void fetchOrder(orderId)
      .then(setOrder)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Commande introuvable'),
      )
      .finally(() => setLoading(false));
  }, [orderId, router]);

  const steps = useMemo(() => {
    if (!order) return [];
    const rank = statusRank(order.status);
    const cancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED';

    return STEP_DEFS.map((step) => {
      let status: 'completed' | 'current' | 'upcoming' = 'upcoming';
      if (!cancelled) {
        if (rank > step.id) status = 'completed';
        else if (rank === step.id) status = 'current';
      }
      const date =
        status === 'upcoming'
          ? '-'
          : formatStepDate(step.id === 1 ? order.createdAt : order.createdAt);

      return { ...step, status, date };
    });
  }, [order]);

  const carrier = order?.carrier || 'Chronopost';
  const statusLabel = order ? ORDER_STATUS_LABEL[order.status] : '';

  return (
    <div className="container mx-auto px-4 max-w-2xl">
      <div className="text-center mb-16 space-y-4">
        <span className="text-primary text-[0.6rem] tracking-[0.4em] font-bold uppercase">Suivi de livraison</span>
        <h1 className="text-4xl md:text-6xl font-headline italic">Où est mon colis ?</h1>
        <p className="text-zay-text-muted tracking-widest text-xs italic">
          {order
            ? `Commande #${order.number} • Transporteur: ${carrier}`
            : orderId
              ? `Commande #${orderId}`
              : 'Commande'}
        </p>
      </div>

      <div className="bg-white p-8 md:p-12 border border-zay-border shadow-sm space-y-12">
        {loading ? (
          <div className="relative min-h-[200px]">
            <ZayBusyOverlay show label="Chargement du suivi…" />
          </div>
        ) : error ? (
          <div className="text-center space-y-4 py-8">
            <p className="text-sm text-red-500 italic">{error}</p>
            <Link href="/compte/commandes" className="text-[0.65rem] uppercase tracking-widest text-primary font-bold underline">
              Voir mes commandes
            </Link>
          </div>
        ) : order && (order.status === 'CANCELLED' || order.status === 'REFUNDED') ? (
          <div className="text-center space-y-3 py-8">
            <p className="text-sm font-bold uppercase tracking-widest">{statusLabel}</p>
            <p className="text-xs text-zay-text-muted italic">Cette commande n’est plus en cours de livraison.</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-zay-border" />
              <div className="space-y-12 relative">
                {steps.map((step) => (
                  <div key={step.id} className="flex gap-8 group">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-500",
                      step.status === 'completed' ? "bg-green-500 text-white" :
                      step.status === 'current' ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" :
                      "bg-zay-gray text-zay-text-muted"
                    )}>
                      <step.icon size={20} />
                    </div>
                    <div className="py-2">
                      <h3 className={cn(
                        "text-sm font-bold uppercase tracking-widest",
                        step.status === 'upcoming' ? "text-zay-text-muted" : "text-zay-text"
                      )}>
                        {step.label}
                      </h3>
                      <p className="text-[0.65rem] text-zay-text-muted italic mt-1">{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-zay-border">
              <div className="bg-zay-main p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-[0.6rem] tracking-[0.2em] font-bold uppercase text-zay-text-muted mb-2">Dernière mise à jour</h4>
                    <p className="text-xs italic font-medium">
                      {order?.trackingCode
                        ? `Suivi ${carrier} : ${order.trackingCode}`
                        : `Statut actuel : ${statusLabel}.`}
                    </p>
                  </div>
                  <span className="text-[0.55rem] font-bold text-primary bg-primary/10 px-2 py-1 uppercase tracking-widest">
                    {statusLabel}
                  </span>
                </div>
                {order?.trackingUrl ? (
                  <a 
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-[0.6rem] tracking-[0.2em] font-bold uppercase text-primary underline underline-offset-4"
                  >
                    Voir sur {carrier}
                  </a>
                ) : (
                  <span className="inline-block text-[0.6rem] tracking-[0.2em] font-bold uppercase text-zay-text-muted">
                    Lien transporteur bientôt disponible
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zay-main">
      <Header />
      <main className="flex-grow pt-32 pb-24">
        <Suspense fallback={
          <div className="relative min-h-[280px]">
            <ZayBusyOverlay show label="Chargement du suivi…" />
          </div>
        }>
          <TrackingContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
