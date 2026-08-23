"use client"

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShoppingBag, 
  Euro, 
  Users, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { fetchAdminStats, type AdminStats } from '@/lib/api/admin';
import { ORDER_STATUS_LABEL, formatMoney } from '@/lib/api/orders';
import { useCachedResource } from '@/hooks/use-cached-resource';

const RevenueChart = dynamic(
  () => import('./revenue-chart').then((m) => m.RevenueChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    ),
  },
);

function Delta({ value }: { value: number }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <p className={cn(
      "text-[0.6rem] font-bold flex items-center mt-1",
      up ? "text-green-600" : "text-red-500"
    )}>
      <Icon className="w-3 h-3 mr-1" /> {up ? '+' : ''}{value}% depuis hier
    </p>
  );
}

export default function AdminDashboard() {
  const { data: stats, loading, error } = useCachedResource<AdminStats>(
    'admin:stats',
    fetchAdminStats,
  );

  if (loading && !stats) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-sm text-red-500 italic">{error || 'Stats indisponibles'}</p>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <Link href="/admin/produits" className="block group">
          <Card className="rounded-none border-zay-border shadow-sm bg-zay-rose-pale h-full group-hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text">Stock faible</CardTitle>
              <AlertTriangle className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-headline italic font-bold">{stats.lowStockCount}</div>
              <p className="text-[0.6rem] text-zay-text-muted italic mt-1 font-bold">Articles nécessitant réapprovisionnement</p>
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
            <RevenueChart data={stats.revenueSeries} />
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
            <Table>
              <TableHeader className="bg-zay-main">
                <TableRow>
                  <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest pl-6">ID</TableHead>
                  <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest">Montant</TableHead>
                  <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest pr-6 text-right">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-xs italic text-zay-text-muted">
                      Aucune commande récente
                    </TableCell>
                  </TableRow>
                ) : stats.recentOrders.map((order) => {
                  const statusLabel = ORDER_STATUS_LABEL[order.status];
                  return (
                  <TableRow key={order.id} className="hover:bg-zay-main transition-colors">
                    <TableCell className="pl-6 py-4">
                      <Link href="/admin/commandes" className="hover:text-primary transition-colors">
                        <p className="text-xs font-bold">{order.number}</p>
                        <p className="text-[0.6rem] text-zay-text-muted italic font-bold">{order.customerName}</p>
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs font-bold">{formatMoney(order.total)}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <Badge className={cn(
                        "rounded-none text-[0.5rem] tracking-[0.1em] font-bold uppercase px-2 py-0.5",
                        statusLabel === 'Payée' ? "bg-green-100 text-green-700" :
                        statusLabel === 'Livrée' ? "bg-blue-100 text-blue-700" :
                        statusLabel === 'Expédiée' ? "bg-purple-100 text-purple-700" :
                        statusLabel === 'Annulée' ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {statusLabel}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
