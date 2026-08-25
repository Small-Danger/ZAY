"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchAdminUsers, type AdminUser } from '@/lib/api/admin';
import { ORDER_STATUS_LABEL, formatMoney, formatOrderDate } from '@/lib/api/orders';
import { useCachedResource } from '@/hooks/use-cached-resource';
import { AdminBusyOverlay } from '@/components/admin/admin-busy-overlay';

function displayName(user: AdminUser): string {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || '—';
}

function initials(user: AdminUser): string {
  const a = user.firstName?.[0] || user.email[0] || 'C';
  const b = user.lastName?.[0] || '';
  return `${a}${b}`.toUpperCase();
}

export default function AdminClientesPage() {
  const [search, setSearch] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const { data: users, loading, error } = useCachedResource<AdminUser[]>(
    `admin:users:${searchApplied}`,
    () => fetchAdminUsers(searchApplied || undefined),
  );
  const list = users ?? [];

  useEffect(() => {
    const t = window.setTimeout(() => setSearchApplied(search.trim()), 350);
    return () => window.clearTimeout(t);
  }, [search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline italic">Clientes</h1>
          <p className="text-zay-text-muted text-xs tracking-widest uppercase italic mt-1">
            Comptes clients ZAY
            {!loading && list.length > 0
              ? ` · ${list.length} cliente${list.length > 1 ? 's' : ''}`
              : ''}
          </p>
        </div>
        <form
          className="relative w-full md:w-72"
          onSubmit={(e) => {
            e.preventDefault();
            setSearchApplied(search.trim());
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zay-text-muted" />
          <Input
            placeholder="Nom, email, téléphone…"
            className="pl-10 h-10 border-zay-border bg-white rounded-none text-xs tracking-widest"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>

      <div className="relative min-h-[280px] bg-white border border-zay-border shadow-sm overflow-hidden">
        <AdminBusyOverlay show={loading} label="Chargement des clientes…" />
        {!loading && error && list.length === 0 ? (
          <div className="p-12 text-center text-sm text-red-500 italic">{error}</div>
        ) : !loading && list.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Users className="w-8 h-8 mx-auto text-primary" />
            <p className="text-sm italic text-zay-text-muted">
              {searchApplied
                ? `Aucune cliente pour « ${searchApplied} ».`
                : 'Aucune cliente pour le moment.'}
            </p>
            {!searchApplied && (
              <p className="text-[0.65rem] text-zay-text-muted max-w-sm mx-auto leading-relaxed">
                Les comptes apparaissent ici dès qu’une cliente s’inscrit ou passe commande sur la boutique.
              </p>
            )}
          </div>
        ) : list.length > 0 ? (
          <Table>
            <TableHeader className="bg-zay-main">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest pl-6 py-4">Cliente</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest">Email</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest">Téléphone</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest text-center">Commandes</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest">Dernière commande</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest">Inscrite le</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest pr-6 text-right">Détail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((user) => {
                const name = displayName(user);
                return (
                  <TableRow key={user.id} className="hover:bg-zay-main transition-colors">
                    <TableCell className="pl-6 py-4">
                      <Link
                        href={`/admin/clientes/${user.id}`}
                        className="flex items-center gap-3 hover:text-primary transition-colors"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zay-gray text-[0.6rem] font-bold">
                          {initials(user)}
                        </span>
                        <span className="text-xs font-bold">{name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">{user.email}</TableCell>
                    <TableCell className="text-xs text-zay-text-muted">{user.phone || '—'}</TableCell>
                    <TableCell className="text-center text-xs tabular-nums">{user.ordersCount}</TableCell>
                    <TableCell className="text-xs">
                      {user.lastOrder ? (
                        <div>
                          <p className="font-bold">{user.lastOrder.number}</p>
                          <p className="text-[0.6rem] text-zay-text-muted">
                            {formatMoney(user.lastOrder.total)} · {ORDER_STATUS_LABEL[user.lastOrder.status]}
                          </p>
                        </div>
                      ) : (
                        <Badge className="rounded-none text-[0.5rem] tracking-[0.1em] font-bold uppercase bg-zay-gray text-zay-text-muted">
                          Aucune
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-zay-text-muted">
                      {formatOrderDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/admin/clientes/${user.id}`} aria-label="Voir la cliente">
                          <Eye size={16} />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : null}
      </div>
    </div>
  );
}
