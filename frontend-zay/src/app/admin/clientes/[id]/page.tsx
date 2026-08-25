"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchAdminUser, type AdminUserDetail } from '@/lib/api/admin';
import { ORDER_STATUS_LABEL, formatMoney, formatOrderDate, formatOrderDateTime } from '@/lib/api/orders';
import { cn } from '@/lib/utils';
import { AdminBusyOverlay } from '@/components/admin/admin-busy-overlay';

export default function AdminClienteDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0];
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAdminUser(id);
        if (!cancelled) setUser(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Cliente introuvable');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="relative min-h-[360px]">
        <AdminBusyOverlay show label="Chargement de la cliente…" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" className="rounded-none text-[0.65rem] font-bold uppercase tracking-widest">
          <Link href="/admin/clientes"><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Link>
        </Button>
        <p className="text-sm text-red-500 italic">{error || 'Cliente introuvable'}</p>
      </div>
    );
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Cliente';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-3">
          <Button asChild variant="ghost" className="rounded-none -ml-3 text-[0.65rem] font-bold uppercase tracking-widest">
            <Link href="/admin/clientes"><ArrowLeft className="w-4 h-4 mr-2" /> Clientes</Link>
          </Button>
          <h1 className="text-3xl font-headline italic">{name}</h1>
          <p className="text-zay-text-muted text-xs tracking-widest uppercase italic">
            Inscrite le {formatOrderDate(user.createdAt)} · {user.ordersCount} commande{user.ordersCount > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-none border-zay-border h-11 text-[0.6rem] font-bold uppercase tracking-widest">
            <a href={`mailto:${user.email}`}>
              <Mail className="w-3.5 h-3.5 mr-2" /> {user.email}
            </a>
          </Button>
          {user.phone && (
            <Button asChild variant="outline" className="rounded-none border-zay-border h-11 text-[0.6rem] font-bold uppercase tracking-widest">
              <a href={`tel:${user.phone}`}>
                <Phone className="w-3.5 h-3.5 mr-2" /> {user.phone}
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4 border border-zay-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-headline italic font-bold flex items-center gap-2">
            <MapPin size={16} className="text-primary" /> Adresses
          </h2>
          {user.addresses.length === 0 ? (
            <p className="text-xs italic text-zay-text-muted">Aucune adresse enregistrée.</p>
          ) : (
            <div className="space-y-4">
              {user.addresses.map((addr) => (
                <div key={addr.id} className="border-t border-zay-border pt-4 first:border-0 first:pt-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-bold uppercase tracking-widest">{addr.name}</p>
                    {addr.isDefault && (
                      <Badge className="rounded-none text-[0.45rem] tracking-widest uppercase bg-primary text-white">
                        Défaut
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-zay-text-muted leading-relaxed">
                    {addr.street}<br />
                    {addr.zip} {addr.city}<br />
                    {addr.country}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 border border-zay-border bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zay-border">
            <h2 className="text-lg font-headline italic font-bold">Commandes</h2>
          </div>
          {user.orders.length === 0 ? (
            <p className="p-8 text-xs italic text-zay-text-muted">Aucune commande.</p>
          ) : (
            <Table>
              <TableHeader className="bg-zay-main">
                <TableRow>
                  <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest pl-6">N°</TableHead>
                  <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest">Date</TableHead>
                  <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest text-center">Articles</TableHead>
                  <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest">Total</TableHead>
                  <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest pr-6">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.orders.map((order) => {
                  const label = ORDER_STATUS_LABEL[order.status];
                  return (
                    <TableRow key={order.id} className="hover:bg-zay-main transition-colors">
                      <TableCell className="pl-6 py-4 text-xs font-bold">
                        <Link
                          href={`/commande/suivi?id=${encodeURIComponent(order.number)}`}
                          className="hover:text-primary transition-colors"
                        >
                          {order.number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-zay-text-muted">
                        {formatOrderDateTime(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-center text-xs">{order.itemsCount}</TableCell>
                      <TableCell className="text-xs font-bold">{formatMoney(order.total)}</TableCell>
                      <TableCell className="pr-6">
                        <Badge className={cn(
                          "rounded-none text-[0.5rem] tracking-[0.1em] font-bold uppercase px-2 py-0.5",
                          label === 'Payée' ? "bg-green-100 text-green-700" :
                          label === 'Livrée' ? "bg-blue-100 text-blue-700" :
                          label === 'Expédiée' ? "bg-purple-100 text-purple-700" :
                          label === 'Annulée' ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
