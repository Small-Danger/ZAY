"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchAdminUsers, type AdminUser } from '@/lib/api/admin';
import { ORDER_STATUS_LABEL, formatMoney, formatOrderDate } from '@/lib/api/orders';
import { useCachedResource } from '@/hooks/use-cached-resource';

export default function AdminClientesPage() {
  const [search, setSearch] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const { data: users, loading, error } = useCachedResource<AdminUser[]>(
    `admin:users:${searchApplied}`,
    () => fetchAdminUsers(searchApplied || undefined),
  );
  const list = users ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline italic">Clientes</h1>
          <p className="text-zay-text-muted text-xs tracking-widest uppercase italic mt-1">Comptes clients ZAY</p>
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
            placeholder="Nom, email, téléphone..."
            className="pl-10 h-10 border-zay-border bg-white rounded-none text-xs tracking-widest"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>

      <div className="bg-white border border-zay-border shadow-sm overflow-hidden">
        {loading && !users ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : error && !users ? (
          <div className="p-12 text-center text-sm text-red-500 italic">{error}</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-sm text-zay-text-muted italic">Aucune cliente.</div>
        ) : (
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
                const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || '—';
                return (
                  <TableRow key={user.id} className="hover:bg-zay-main transition-colors">
                    <TableCell className="pl-6 py-4 text-xs font-bold">
                      <Link href={`/admin/clientes/${user.id}`} className="hover:text-primary transition-colors">
                        {name}
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
        )}
      </div>
    </div>
  );
}
