"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useMyOrders } from '@/hooks/use-orders';
import {
  ORDER_STATUS_LABEL,
  formatMoney,
  formatOrderDate,
} from '@/lib/api/orders';
import { getAccessToken } from '@/lib/auth/session';
import { MediaImage } from '@/components/ui/media-image';
import { resolveMediaUrl } from '@/lib/api/config';
import { ZayBusyOverlay } from '@/components/ui/zay-busy-overlay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useMyOrders } from '@/hooks/use-orders';
import {
  ORDER_STATUS_LABEL,
  formatMoney,
  formatOrderDate,
} from '@/lib/api/orders';
import { getAccessToken } from '@/lib/auth/session';

export default function UserOrdersPage() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const { data: orders, loading, error } = useMyOrders(authed);

  useEffect(() => {
    setAuthed(!!getAccessToken());
    setReady(true);
  }, []);

  return (
    <div className="space-y-10 md:space-y-12">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-headline italic">Mes Commandes</h1>
        <p className="text-zay-text-muted tracking-widest text-[0.65rem] md:text-xs italic">Suivez l'état de vos achats et retrouvez vos factures.</p>
      </div>

      {!ready || (authed && loading) ? (
        <div className="relative min-h-[240px]">
          <ZayBusyOverlay show label="Chargement des commandes…" />
        </div>
      ) : !authed ? (
        <div className="py-16 text-center space-y-6 border border-dashed border-zay-border">
          <p className="text-zay-text-muted italic text-sm">Connectez-vous pour voir vos commandes.</p>
          <Button asChild className="bg-primary hover:bg-zay-text text-white rounded-none px-8 py-6 text-[0.65rem] tracking-[0.2em] font-bold uppercase">
            <Link href="/connexion">Se connecter</Link>
          </Button>
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 italic">{error}</p>
      ) : (
      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="py-16 md:py-20 text-center space-y-6 border border-dashed border-zay-border">
            <div className="flex justify-center">
              <ShoppingBag className="w-10 h-10 md:w-12 md:h-12 text-zay-gray" />
            </div>
            <p className="text-zay-text-muted italic tracking-widest text-xs md:text-sm">Vous n'avez pas encore passé de commande.</p>
            <Button asChild className="bg-primary hover:bg-zay-text text-white rounded-none px-8 py-6 text-[0.6rem] md:text-[0.65rem] tracking-[0.2em] font-bold uppercase">
              <Link href="/catalogue">Découvrir la collection</Link>
            </Button>
          </div>
        ) : (
          orders.map((order, idx) => {
            const statusLabel = ORDER_STATUS_LABEL[order.status];
            return (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white border border-zay-border hover:border-primary transition-colors overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="relative w-full sm:w-24 md:w-32 aspect-[3/4] bg-zay-gray flex-shrink-0">
                  {order.thumbnailUrl ? (
                    <MediaImage
                      src={resolveMediaUrl(order.thumbnailUrl)}
                      alt={order.number}
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="flex-grow p-4 md:p-6 flex flex-col justify-between">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h3 className="text-[0.6rem] md:text-[0.65rem] font-bold tracking-[0.2em] uppercase text-zay-text">Commande #{order.number}</h3>
                      <p className="text-[0.55rem] md:text-[0.65rem] text-zay-text-muted italic">Passée le {formatOrderDate(order.createdAt)}</p>
                    </div>
                    <Badge className={cn(
                      "rounded-none text-[0.5rem] md:text-[0.55rem] tracking-[0.1em] font-bold uppercase px-2 md:px-3 py-1",
                      statusLabel === 'Livrée' ? "bg-green-100 text-green-700" :
                      statusLabel === 'En transit' || statusLabel === 'Expédiée' ? "bg-primary/10 text-primary" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {statusLabel}
                    </Badge>
                  </div>

                  <div className="mt-6 md:mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 md:gap-6">
                    <div className="flex gap-8 md:gap-12">
                      <div>
                        <p className="text-[0.5rem] md:text-[0.55rem] tracking-[0.2em] font-bold uppercase text-zay-text-muted mb-1">Articles</p>
                        <p className="text-xs md:text-sm font-medium">{order.itemsCount}</p>
                      </div>
                      <div>
                        <p className="text-[0.5rem] md:text-[0.55rem] tracking-[0.2em] font-bold uppercase text-zay-text-muted mb-1">Total</p>
                        <p className="text-xs md:text-sm font-bold">{formatMoney(order.total)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                      <Button asChild className="flex-1 sm:flex-none h-9 md:h-10 rounded-none bg-zay-text hover:bg-primary text-white text-[0.55rem] md:text-[0.6rem] tracking-[0.2em] font-bold uppercase px-4">
                        <Link href={`/commande/suivi?id=${encodeURIComponent(order.number)}`}>
                          Suivre <ArrowRight size={14} className="ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            );
          })
        )}
      </div>
      )}

      <div className="pt-8 border-t border-zay-border flex justify-center">
        <Link href="/catalogue" className="text-[0.55rem] md:text-[0.6rem] tracking-[0.3em] md:tracking-[0.4em] font-bold uppercase text-zay-text-muted hover:text-primary transition-colors flex items-center gap-3 md:gap-4 group">
          Continuer mon shopping <ArrowRight size={16} className="transition-transform group-hover:translate-x-2" />
        </Link>
      </div>
    </div>
  );
}
