"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Download, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAdminOrders } from '@/hooks/use-orders';
import {
  ORDER_STATUS_LABEL,
  exportOrdersCsv,
  fetchOrder,
  formatMoney,
  formatOrderDateTime,
  updateOrderStatus,
  type ApiOrder,
  type ApiOrderStatus,
} from '@/lib/api/orders';
import Link from 'next/link';
import { notifyError, notifySuccess } from '@/lib/notify';
import { AdminBusyOverlay } from '@/components/admin/admin-busy-overlay';
import { MediaImage } from '@/components/ui/media-image';

const TAB_STATUS: Record<string, ApiOrderStatus | undefined> = {
  all: undefined,
  pending: 'PENDING',
  paid: 'PAID',
  shipped: 'SHIPPED',
  delivered: 'DELIVERED',
};

const STATUS_OPTIONS: ApiOrderStatus[] = [
  'PENDING',
  'PAID',
  'PREPARING',
  'SHIPPED',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatFrDate(iso: string): string {
  if (!iso || iso.length < 10) return iso;
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function periodPresets() {
  const today = new Date();
  const last7 = new Date();
  last7.setDate(today.getDate() - 6);
  const last30 = new Date();
  last30.setDate(today.getDate() - 29);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  return [
    { id: 'today', label: 'Aujourd’hui', from: toIsoDate(today), to: toIsoDate(today) },
    { id: '7d', label: '7 jours', from: toIsoDate(last7), to: toIsoDate(today) },
    { id: '30d', label: '30 jours', from: toIsoDate(last30), to: toIsoDate(today) },
    { id: 'month', label: 'Ce mois', from: toIsoDate(monthStart), to: toIsoDate(today) },
    {
      id: 'prev',
      label: 'Mois dernier',
      from: toIsoDate(prevMonthStart),
      to: toIsoDate(prevMonthEnd),
    },
  ] as const;
}

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [periodDraft, setPeriodDraft] = useState({ from: '', to: '' });
  const [periodOpen, setPeriodOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<ApiOrder | null>(null);
  const [status, setStatus] = useState<ApiOrderStatus>('PAID');
  const [carrier, setCarrier] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSearchApplied(search.trim()), 350);
    return () => window.clearTimeout(t);
  }, [search]);

  const params = useMemo(
    () => ({
      status: TAB_STATUS[filter],
      search: searchApplied || undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    [filter, searchApplied, from, to],
  );

  const { data: orders, loading, error, refetch } = useAdminOrders(params);

  const openOrder = (order: ApiOrder) => {
    setSelected(order);
    setStatus(order.status);
    setCarrier(order.carrier || '');
    setTrackingCode(order.trackingCode || '');
    setTrackingUrl(order.trackingUrl || '');
    setDetailLoading(true);
    void fetchOrder(order.id)
      .then((full) => {
        setSelected(full);
        setStatus(full.status);
        setCarrier(full.carrier || '');
        setTrackingCode(full.trackingCode || '');
        setTrackingUrl(full.trackingUrl || '');
      })
      .catch((err) => notifyError(err, 'Impossible de charger le détail'))
      .finally(() => setDetailLoading(false));
  };

  const handleSaveStatus = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await updateOrderStatus(selected.id, {
        status,
        carrier: carrier.trim() || undefined,
        trackingCode: trackingCode.trim() || undefined,
        trackingUrl: trackingUrl.trim() || undefined,
      });
      notifySuccess(`Commande ${selected.number} mise à jour.`);
      setSelected(null);
      await refetch();
    } catch (err) {
      notifyError(err, 'Erreur mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportOrdersCsv(params);
    } catch (err) {
      notifyError(err, 'Erreur export');
    } finally {
      setExporting(false);
    }
  };

  const periodLabel =
    from || to
      ? `${from ? formatFrDate(from) : '…'} → ${to ? formatFrDate(to) : '…'}`
      : 'Période';

  const presets = periodPresets();
  const activePresetId = presets.find(
    (p) => p.from === periodDraft.from && p.to === periodDraft.to,
  )?.id;

  const applyPeriod = (nextFrom: string, nextTo: string) => {
    let start = nextFrom;
    let end = nextTo;
    if (start && end && start > end) {
      [start, end] = [end, start];
    }
    setFrom(start);
    setTo(end);
    setPeriodOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline italic">Commandes</h1>
          <p className="text-zay-text-muted text-xs tracking-widest uppercase italic mt-1">
            Gestion et suivi des ventes
            {(from || to) && (
              <span className="not-italic ml-2 text-primary">
                · {from ? formatFrDate(from) : '…'} → {to ? formatFrDate(to) : '…'}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={exporting}
            onClick={() => void handleExport()}
            className="rounded-none border-zay-border h-12 text-[0.65rem] tracking-[0.2em] font-bold uppercase"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Export…' : 'Exporter'}
          </Button>
          <Button
            type="button"
            onClick={() => {
              setPeriodDraft({ from, to });
              setPeriodOpen(true);
            }}
            className={cn(
              'rounded-none px-6 py-6 text-[0.65rem] tracking-[0.2em] font-bold uppercase transition-all',
              from || to
                ? 'bg-primary text-white hover:bg-zay-text'
                : 'bg-zay-text hover:bg-primary text-white',
            )}
          >
            <Calendar className="w-4 h-4 mr-2" /> {periodLabel}
          </Button>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <TabsList className="bg-zay-gray rounded-none p-1 h-auto flex-wrap">
            <TabsTrigger value="all" className="text-[0.6rem] tracking-[0.1em] font-bold uppercase py-2 px-4 data-[state=active]:bg-white rounded-none">Toutes</TabsTrigger>
            <TabsTrigger value="pending" className="text-[0.6rem] tracking-[0.1em] font-bold uppercase py-2 px-4 data-[state=active]:bg-white rounded-none">En attente</TabsTrigger>
            <TabsTrigger value="paid" className="text-[0.6rem] tracking-[0.1em] font-bold uppercase py-2 px-4 data-[state=active]:bg-white rounded-none">Payées</TabsTrigger>
            <TabsTrigger value="shipped" className="text-[0.6rem] tracking-[0.1em] font-bold uppercase py-2 px-4 data-[state=active]:bg-white rounded-none">Expédiées</TabsTrigger>
            <TabsTrigger value="delivered" className="text-[0.6rem] tracking-[0.1em] font-bold uppercase py-2 px-4 data-[state=active]:bg-white rounded-none">Livrées</TabsTrigger>
          </TabsList>

          <form
            className="relative w-full md:w-64"
            onSubmit={(e) => {
              e.preventDefault();
              setSearchApplied(search.trim());
            }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zay-text-muted" />
            <Input 
              placeholder="Commande ou cliente..." 
              className="pl-10 h-10 border-zay-border bg-white rounded-none text-xs tracking-widest"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        </div>

        <div className="relative min-h-[280px] bg-white border border-zay-border shadow-sm overflow-hidden">
          <AdminBusyOverlay show={loading} label="Chargement des commandes…" />
          {!loading && error && orders.length === 0 ? (
            <div className="p-12 text-center text-sm text-red-500 italic">{error}</div>
          ) : !loading && orders.length === 0 ? (
            <div className="p-12 text-center text-sm text-zay-text-muted italic">
              Aucune commande pour ce filtre.
            </div>
          ) : orders.length > 0 ? (
          <Table>
            <TableHeader className="bg-zay-main">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest pl-6 py-4">ID Commande</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest">Date</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest">Cliente</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest text-center">Articles</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest">Total</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest">Statut</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest pr-6 text-right">Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const statusLabel = ORDER_STATUS_LABEL[order.status];
                return (
                <TableRow key={order.id} className="hover:bg-zay-main transition-colors group">
                  <TableCell className="pl-6 py-4 font-bold text-xs">{order.number}</TableCell>
                  <TableCell className="text-xs text-zay-text-muted">{formatOrderDateTime(order.createdAt)}</TableCell>
                  <TableCell className="text-xs font-medium">{order.customerName}</TableCell>
                  <TableCell className="text-center text-xs tabular-nums">{order.itemsCount}</TableCell>
                  <TableCell className="text-xs font-bold">{formatMoney(order.total)}</TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "rounded-none text-[0.5rem] tracking-[0.1em] font-bold uppercase px-2 py-0.5",
                      statusLabel === 'Payée' ? "bg-green-100 text-green-700" :
                      statusLabel === 'Livrée' ? "bg-blue-100 text-blue-700" :
                      statusLabel === 'Expédiée' ? "bg-purple-100 text-purple-700" :
                      statusLabel === 'Annulée' ? "bg-red-100 text-red-700" :
                      statusLabel === 'Remboursée' ? "bg-gray-100 text-gray-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zay-text-muted hover:text-primary"
                      onClick={() => openOrder(order)}
                    >
                      <Eye size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
          ) : null}
        </div>
      </Tabs>

      <AdminBusyOverlay show={exporting} label="Export CSV…" placement="fixed" />

      <Dialog
        open={periodOpen}
        onOpenChange={(open) => {
          setPeriodOpen(open);
          if (!open) document.body.style.pointerEvents = '';
        }}
      >
        <DialogContent className="rounded-none border-zay-border max-w-[420px] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 py-4 border-b border-zay-border">
            <DialogTitle className="text-xl font-headline italic">Période</DialogTitle>
            <p className="text-[0.65rem] text-zay-text-muted tracking-wide">
              Filtrer les commandes par dates.
            </p>
          </DialogHeader>
          <div className="px-5 py-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setPeriodDraft({ from: preset.from, to: preset.to });
                    applyPeriod(preset.from, preset.to);
                  }}
                  className={cn(
                    'h-8 px-3 text-[0.55rem] font-bold uppercase tracking-widest border rounded-none transition-colors',
                    activePresetId === preset.id ||
                      (from === preset.from && to === preset.to)
                      ? 'bg-primary text-white border-primary'
                      : 'border-zay-border text-zay-text hover:border-primary hover:text-primary',
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                  Du
                </Label>
                <Input
                  type="date"
                  value={periodDraft.from}
                  max={periodDraft.to || undefined}
                  onChange={(e) =>
                    setPeriodDraft((p) => ({ ...p, from: e.target.value }))
                  }
                  className="h-10 border-zay-border rounded-none text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                  Au
                </Label>
                <Input
                  type="date"
                  value={periodDraft.to}
                  min={periodDraft.from || undefined}
                  onChange={(e) =>
                    setPeriodDraft((p) => ({ ...p, to: e.target.value }))
                  }
                  className="h-10 border-zay-border rounded-none text-xs"
                />
              </div>
            </div>
            {(periodDraft.from || periodDraft.to) && (
              <p className="text-[0.65rem] text-zay-text-muted">
                {periodDraft.from ? formatFrDate(periodDraft.from) : '…'}
                {' → '}
                {periodDraft.to ? formatFrDate(periodDraft.to) : '…'}
              </p>
            )}
          </div>
          <DialogFooter className="border-t border-zay-border px-5 py-3 gap-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setPeriodDraft({ from: '', to: '' });
                setFrom('');
                setTo('');
                setPeriodOpen(false);
              }}
              className="rounded-none text-[0.65rem] font-bold uppercase tracking-widest"
            >
              Tout voir
            </Button>
            <Button
              type="button"
              onClick={() => applyPeriod(periodDraft.from, periodDraft.to)}
              className="bg-primary text-white rounded-none px-8 h-10 text-[0.65rem] font-bold uppercase tracking-widest"
            >
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (saving && !open) return;
          if (!open) {
            setSelected(null);
            document.body.style.pointerEvents = '';
          }
        }}
      >
        <DialogContent
          className={cn(
            'rounded-none border-zay-border max-w-lg p-0 gap-0 overflow-hidden',
            saving && '[&>button]:pointer-events-none [&>button]:opacity-0',
          )}
          onPointerDownOutside={(e) => {
            if (saving) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (saving) e.preventDefault();
          }}
        >
          <AdminBusyOverlay
            show={saving || detailLoading}
            label={saving ? 'Enregistrement…' : 'Chargement…'}
          />
          <DialogHeader className="px-5 py-4 border-b border-zay-border">
            <DialogTitle className="text-xl font-headline italic">
              {selected?.number}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
              <p className="text-xs text-zay-text-muted">
                {selected.customerName}
                {selected.phone ? ` · ${selected.phone}` : ''}
                <span className="block mt-1 not-italic font-bold text-zay-text">
                  {formatMoney(selected.total)}
                </span>
              </p>
              <p className="text-[0.65rem] text-zay-text-muted leading-relaxed">
                {selected.addressLine}
                <br />
                {selected.postalCode} {selected.city}
                {selected.country ? ` · ${selected.country}` : ''}
              </p>

              {selected.items && selected.items.length > 0 ? (
                <div className="space-y-2 border border-zay-border p-3">
                  {selected.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative h-12 w-9 shrink-0 overflow-hidden bg-zay-gray">
                        <MediaImage src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.65rem] font-bold truncate">{item.name}</p>
                        <p className="text-[0.55rem] uppercase tracking-widest text-zay-text-muted">
                          {item.size} · {item.color} · ×{item.quantity}
                        </p>
                      </div>
                      <p className="text-[0.65rem] font-bold tabular-nums">
                        {formatMoney(item.lineTotal)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">Statut</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ApiOrderStatus)}
                  className="w-full h-10 border border-zay-border bg-white px-3 text-xs tracking-widest rounded-none"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">Transporteur</Label>
                  <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} className="h-10 border-zay-border rounded-none" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">N° suivi</Label>
                  <Input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} className="h-10 border-zay-border rounded-none" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">URL suivi</Label>
                <Input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} className="h-10 border-zay-border rounded-none" />
              </div>
              <Button asChild variant="outline" className="w-full rounded-none border-zay-border h-10 text-[0.65rem] font-bold uppercase tracking-widest">
                <Link href={`/commande/suivi?id=${encodeURIComponent(selected.number)}`}>
                  Voir le suivi client
                </Link>
              </Button>
            </div>
          )}
          <DialogFooter className="border-t border-zay-border px-5 py-3 gap-2">
            <Button type="button" variant="ghost" disabled={saving} onClick={() => setSelected(null)} className="rounded-none text-[0.65rem] font-bold uppercase tracking-widest">
              Annuler
            </Button>
            <Button
              type="button"
              disabled={saving || detailLoading}
              onClick={() => void handleSaveStatus()}
              className="bg-primary text-white rounded-none px-8 h-10 text-[0.65rem] font-bold uppercase tracking-widest"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
