"use client"

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShoppingBag, 
  Euro, 
  Users, 
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  Check,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { fetchAdminStats, type AdminStats } from '@/lib/api/admin';
import { resolveMediaUrl } from '@/lib/api/config';
import { ORDER_STATUS_LABEL, formatMoney, formatOrderDateTime } from '@/lib/api/orders';
import { useCachedResource } from '@/hooks/use-cached-resource';
import { AdminBusyOverlay } from '@/components/admin/admin-busy-overlay';
import { MediaImage } from '@/components/ui/media-image';

const RevenueChart = dynamic(
  () => import('./revenue-chart').then((m) => m.RevenueChart),
  {
    ssr: false,
    loading: () => (
      <div className="relative h-full min-h-[200px]">
        <AdminBusyOverlay show label="Chargement du graphique…" />
      </div>
    ),
  },
);

function Delta({ value }: { value: number }) {
  if (value === 0) {
    return (
      <p className="text-[0.6rem] text-zay-text-muted italic mt-1">Stable vs hier</p>
    );
  }
  const up = value > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <p className={cn(
      'text-[0.6rem] font-bold flex items-center mt-1',
      up ? 'text-green-600' : 'text-red-500',
    )}>
      <Icon className="w-3 h-3 mr-1" /> {up ? '+' : ''}{value}% vs hier
    </p>
  );
}

function statusBadgeClass(label: string) {
  if (label === 'Payée') return 'bg-green-100 text-green-700';
  if (label === 'Livrée') return 'bg-blue-100 text-blue-700';
  if (label === 'Expédiée') return 'bg-purple-100 text-purple-700';
  if (label === 'Annulée') return 'bg-red-100 text-red-700';
  if (label === 'Remboursée') return 'bg-gray-100 text-gray-700';
  return 'bg-amber-100 text-amber-700';
}

function ActionStrip({ stats }: { stats: AdminStats }) {
  const toPrepare = stats.toPrepareCount ?? 0;
  const awaiting = stats.awaitingPaymentCount ?? 0;
  const unread = stats.unreadMessages ?? 0;
  const lowItems = stats.lowStockItems ?? [];
  const lowCount = stats.lowStockCount ?? 0;
  const ordersTodo = toPrepare + awaiting;
  const showOrders = ordersTodo > 0;
  const showStock = lowCount > 0;
  const showMail = unread > 0;
  const columns = [showOrders, showStock, showMail].filter(Boolean).length;

  return (
    <section className="bg-white border border-zay-border shadow-sm">
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-zay-border">
        <h2 className="text-[0.65rem] font-bold uppercase tracking-widest">À faire</h2>
        {columns === 0 && (
          <span className="flex items-center gap-1.5 text-[0.6rem] text-zay-text-muted italic">
            <Check className="w-3.5 h-3.5 text-primary" /> Rien à traiter pour le moment
          </span>
        )}
      </div>
      {columns > 0 && (
        <div
          className={cn(
            'grid divide-y md:divide-y-0 md:divide-x divide-zay-border',
            columns === 1 && 'md:grid-cols-1',
            columns === 2 && 'md:grid-cols-2',
            columns >= 3 && 'md:grid-cols-3',
          )}
        >
          {showOrders && (
            <Link
              href={
                awaiting > 0 && toPrepare === 0
                  ? '/admin/commandes?tab=pending'
                  : '/admin/commandes?tab=paid'
              }
              className="p-5 hover:bg-zay-rose-pale/30 transition-colors"
            >
              <p className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted mb-2">
                Commandes
              </p>
              <p className="text-2xl font-headline italic font-bold">{ordersTodo}</p>
              <p className="text-[0.65rem] text-zay-text-muted mt-1 leading-relaxed">
                {[
                  toPrepare > 0 ? `${toPrepare} à préparer` : null,
                  awaiting > 0 ? `${awaiting} en attente de paiement` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </Link>
          )}

          {showStock && (
            <Link href="/admin/produits" className="p-5 hover:bg-zay-rose-pale/30 transition-colors">
              <p className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted mb-2">
                Stock faible
              </p>
              <ul className="space-y-2">
                {lowItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <span className="relative h-8 w-8 shrink-0 overflow-hidden bg-zay-gray">
                      <MediaImage
                        src={resolveMediaUrl(item.image)}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold truncate">{item.name}</span>
                      <span className="text-[0.55rem] text-zay-text-muted uppercase tracking-widest">
                        {item.stock <= 0 ? 'Rupture' : `${item.stock} en stock`}
                      </span>
                    </span>
                  </li>
                ))}
                {lowCount > lowItems.length && (
                  <li className="text-[0.6rem] text-primary font-bold uppercase tracking-widest">
                    +{lowCount - lowItems.length} autres
                  </li>
                )}
              </ul>
            </Link>
          )}

          {showMail && (
            <Link href="/admin/messages" className="p-5 hover:bg-zay-rose-pale/30 transition-colors">
              <p className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted mb-2">
                Messages
              </p>
              <p className="flex items-center gap-2 text-2xl font-headline italic font-bold">
                <Mail className="w-4 h-4 text-primary" />
                {unread}
              </p>
              <p className="text-[0.65rem] text-zay-text-muted mt-1">
                {unread} non lu{unread > 1 ? 's' : ''}
              </p>
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export default function AdminDashboard() {
  const { data: stats, loading, error } = useCachedResource<AdminStats>(
    'admin:stats',
    fetchAdminStats,
  );
  const hasChartSales = Boolean(stats?.revenueSeries.some((p) => p.ca > 0));

  return (
    <div className="relative space-y-8 min-h-[360px]">
      <AdminBusyOverlay show={loading && !stats} label="Chargement du dashboard…" />

      <div>
        <h1 className="text-3xl font-headline italic">Dashboard</h1>
        <p className="text-zay-text-muted text-xs tracking-widest uppercase italic mt-1">
          Vue du jour
        </p>
      </div>

      {!stats && !loading ? (
        <p className="text-sm text-red-500 italic">{error || 'Stats indisponibles'}</p>
      ) : stats ? (
        <>
      <ActionStrip stats={stats} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/commandes" className="block group">
          <Card className="rounded-none border-zay-border shadow-sm h-full group-hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Commandes du jour</CardTitle>
              <ShoppingBag className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-headline italic font-bold">{stats.ordersToday}</div>
              <Delta value={stats.ordersTodayDeltaPct} />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/commandes" className="block group">
          <Card className="rounded-none border-zay-border shadow-sm h-full group-hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">CA du jour</CardTitle>
              <Euro className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-headline italic font-bold">{formatMoney(stats.revenueToday)}</div>
              <Delta value={stats.revenueTodayDeltaPct} />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/clientes" className="block group">
          <Card className="rounded-none border-zay-border shadow-sm h-full group-hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Nouveaux comptes</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-headline italic font-bold">{stats.newUsersToday}</div>
              <Delta value={stats.newUsersTodayDeltaPct} />
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-none border-zay-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-headline italic font-bold">Évolution du CA (30 jours)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] mt-4">
            {hasChartSales ? (
              <RevenueChart data={stats.revenueSeries} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-zay-text-muted">
                <Euro className="w-7 h-7 text-primary" />
                <p className="text-xs italic">Pas encore de ventes sur 30 jours.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-none border-zay-border shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-headline italic font-bold">Dernières commandes</CardTitle>
            <Link href="/admin/commandes" className="text-[0.55rem] font-bold uppercase tracking-widest text-primary hover:underline">
              Voir tout
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentOrders.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <ShoppingBag className="w-7 h-7 mx-auto text-primary" />
                <p className="text-xs italic text-zay-text-muted">Aucune commande récente.</p>
              </div>
            ) : (
            <Table>
              <TableHeader className="bg-zay-main">
                <TableRow>
                  <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest pl-6">Commande</TableHead>
                  <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest">Montant</TableHead>
                  <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest pr-6 text-right">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrders.map((order) => {
                  const statusLabel = ORDER_STATUS_LABEL[order.status];
                  return (
                  <TableRow key={order.id} className="hover:bg-zay-main transition-colors">
                    <TableCell className="pl-6 py-4">
                      <Link
                        href={`/admin/commandes?q=${encodeURIComponent(order.number)}`}
                        className="hover:text-primary transition-colors"
                      >
                        <p className="text-xs font-bold">{order.number}</p>
                        <p className="text-[0.6rem] text-zay-text-muted italic font-bold">{order.customerName}</p>
                        <p className="text-[0.55rem] text-zay-text-muted italic mt-0.5">
                          {formatOrderDateTime(order.createdAt)}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs font-bold">{formatMoney(order.total)}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <Badge className={cn(
                        'rounded-none text-[0.5rem] tracking-[0.1em] font-bold uppercase px-2 py-0.5',
                        statusBadgeClass(statusLabel),
                      )}>
                        {statusLabel}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>
        </>
      ) : null}
    </div>
  );
}
