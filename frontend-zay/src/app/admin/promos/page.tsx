"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Tag, Trash2, Edit2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  createPromo,
  deletePromo,
  fetchPromos,
  formatPromoExpiration,
  formatPromoValue,
  updatePromo,
  type ApiPromo,
  type PromoType,
} from '@/lib/api/promos';
import { notifyError, notifySuccess } from '@/lib/notify';
import { useCachedResource } from '@/hooks/use-cached-resource';
import { AdminBusyOverlay } from '@/components/admin/admin-busy-overlay';
import { cn } from '@/lib/utils';

const emptyForm = {
  code: '',
  type: 'PERCENTAGE' as PromoType,
  value: '',
  expiresAt: '',
  usageLimit: '',
};

function sanitizeCode(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase().slice(0, 40);
}

function sanitizePositiveNumber(raw: string, max?: number): string {
  if (raw.trim() === '') return '';
  const n = Number(raw.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return '0';
  const next = max != null ? Math.min(max, n) : n;
  return String(next);
}

function sanitizeLimit(raw: string): string {
  if (raw.trim() === '') return '';
  const digits = raw.replace(/[^\d]/g, '');
  if (digits === '') return '';
  const n = parseInt(digits, 10);
  return String(Math.max(1, n));
}

function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function AdminPromosPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiPromo | null>(null);
  const { data: promoList, loading, refetch: load } = useCachedResource<ApiPromo[]>(
    'admin:promos',
    fetchPromos,
  );
  const promos = promoList ?? [];
  const [saving, setSaving] = useState(false);
  const [busyLabel, setBusyLabel] = useState('Enregistrement…');
  const [form, setForm] = useState(emptyForm);

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    document.body.style.pointerEvents = '';
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (promo: ApiPromo) => {
    setEditing(promo);
    setForm({
      code: promo.code,
      type: promo.type,
      value: String(promo.value),
      expiresAt: promo.expiresAt ? promo.expiresAt.slice(0, 10) : '',
      usageLimit: promo.usageLimit != null ? String(promo.usageLimit) : '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.value || saving) return;
    setBusyLabel(editing ? 'Mise à jour…' : 'Enregistrement…');
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        type: form.type,
        value: parseFloat(form.value) || 0,
        expiresAt: form.expiresAt
          ? new Date(`${form.expiresAt}T23:59:59`).toISOString()
          : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : null,
        active: true,
      };
      if (editing) {
        await updatePromo(editing.id, payload);
        notifySuccess(`Code « ${payload.code} » mis à jour.`);
      } else {
        await createPromo(payload);
        notifySuccess(`Code « ${payload.code} » créé.`);
      }
      closeModal();
      await load();
    } catch (err) {
      notifyError(err, editing ? 'Erreur mise à jour promo' : 'Erreur création promo');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (promo: ApiPromo) => {
    try {
      await updatePromo(promo.id, { active: !promo.active });
      notifySuccess(
        promo.active
          ? `Code « ${promo.code} » désactivé.`
          : `Code « ${promo.code} » activé.`,
      );
      await load();
    } catch (err) {
      notifyError(err, 'Erreur mise à jour');
    }
  };

  const handleDelete = async (promo: ApiPromo) => {
    if (saving) return;
    setBusyLabel('Suppression…');
    setSaving(true);
    try {
      await deletePromo(promo.id);
      notifySuccess(`Code « ${promo.code} » supprimé.`);
      await load();
    } catch (err) {
      notifyError(err, 'Erreur suppression');
    } finally {
      setSaving(false);
    }
  };

  const valueMax = form.type === 'PERCENTAGE' ? 100 : undefined;

  return (
    <div className="space-y-8">
      <AdminBusyOverlay
        show={saving && !modalOpen}
        label={busyLabel}
        placement="fixed"
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline italic">Codes Promo</h1>
          <p className="text-zay-text-muted text-xs tracking-widest uppercase italic mt-1">
            Marketing et fidélisation
            {promos.length > 0 ? ` · ${promos.length} code${promos.length > 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-primary hover:bg-zay-text text-white rounded-none px-6 py-6 text-[0.65rem] tracking-[0.2em] font-bold uppercase shadow-xl shadow-primary/20"
        >
          <Plus className="w-4 h-4 mr-2" /> Créer un code
        </Button>
      </div>

      <div className="relative min-h-[280px] bg-white border border-zay-border shadow-sm overflow-hidden">
        <AdminBusyOverlay show={loading && !promoList} label="Chargement des codes…" />
        {!loading && promos.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <Tag className="w-8 h-8 mx-auto text-primary" />
            <p className="text-sm italic text-zay-text-muted">Aucun code promo pour le moment.</p>
            <Button
              type="button"
              onClick={openCreate}
              className="bg-primary text-white rounded-none h-10 px-6 text-[0.65rem] font-bold uppercase tracking-widest"
            >
              Créer le premier code
            </Button>
          </div>
        ) : promos.length > 0 ? (
          <Table>
            <TableHeader className="bg-zay-main">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest pl-6 py-4">Code</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest">Type / Valeur</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest">Expiration</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest text-center">Usages</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest text-center">Statut</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promos.map((promo) => {
                const limit = promo.usageLimit ?? '∞';
                const usages = promo.usageCount;
                return (
                  <TableRow key={promo.id} className="hover:bg-zay-main transition-colors">
                    <TableCell className="pl-6 py-5">
                      <div className="flex items-center gap-3">
                        <Tag className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold tracking-widest uppercase">{promo.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-bold text-primary">{formatPromoValue(promo)}</p>
                      <p className="text-[0.6rem] text-zay-text-muted uppercase tracking-tighter">
                        {promo.type === 'PERCENTAGE' ? 'De remise (%)' : 'Remise fixe'}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs italic text-zay-text-muted">
                      {formatPromoExpiration(promo.expiresAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold tabular-nums">{usages} / {limit}</span>
                        <div className="w-16 h-1 bg-zay-gray mt-1 overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width:
                                limit === '∞'
                                  ? '10%'
                                  : `${Math.min(100, (usages / (limit as number)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={promo.active}
                          onCheckedChange={() => void handleToggle(promo)}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zay-text-muted hover:text-primary"
                          onClick={() => openEdit(promo)}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zay-text-muted hover:text-red-500"
                          onClick={() => void handleDelete(promo)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : null}
      </div>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (saving && !open) return;
          if (!open) closeModal();
          else setModalOpen(true);
        }}
      >
        <DialogContent
          className={cn(
            'rounded-none border-zay-border max-w-[420px] p-0 gap-0 overflow-hidden',
            saving && '[&>button]:pointer-events-none [&>button]:opacity-0',
          )}
          onPointerDownOutside={(e) => {
            if (saving) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (saving) e.preventDefault();
          }}
        >
          <AdminBusyOverlay show={saving} label={busyLabel} />
          <form onSubmit={handleSave} className="flex flex-col">
            <DialogHeader className="px-5 py-4 border-b border-zay-border">
              <DialogTitle className="text-xl font-headline italic">
                {editing ? 'Modifier le code' : 'Nouveau code promo'}
              </DialogTitle>
            </DialogHeader>
            <div className="px-5 py-4 space-y-4">
              <div className="space-y-1">
                <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                  Code
                </Label>
                <Input
                  required
                  placeholder="ZAY15"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: sanitizeCode(e.target.value) })}
                  className="h-10 border-zay-border rounded-none tracking-widest font-bold uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                    Type
                  </Label>
                  <select
                    className="w-full h-10 border border-zay-border rounded-none text-[0.65rem] font-bold uppercase tracking-widest px-3"
                    value={form.type}
                    onChange={(e) => {
                      const type = e.target.value as PromoType;
                      setForm({
                        ...form,
                        type,
                        value:
                          type === 'PERCENTAGE'
                            ? sanitizePositiveNumber(form.value, 100)
                            : form.value,
                      });
                    }}
                  >
                    <option value="PERCENTAGE">% remise</option>
                    <option value="AMOUNT">Montant €</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                    Valeur
                  </Label>
                  <Input
                    required
                    inputMode="decimal"
                    placeholder={form.type === 'PERCENTAGE' ? '15' : '20'}
                    value={form.value}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        value: sanitizePositiveNumber(e.target.value, valueMax),
                      })
                    }
                    className="h-10 border-zay-border rounded-none font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                    Expiration
                  </Label>
                  <Input
                    type="date"
                    min={todayIso()}
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="h-10 border-zay-border rounded-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                    Limite d&apos;usages
                  </Label>
                  <Input
                    inputMode="numeric"
                    placeholder="Illimité"
                    value={form.usageLimit}
                    onChange={(e) =>
                      setForm({ ...form, usageLimit: sanitizeLimit(e.target.value) })
                    }
                    className="h-10 border-zay-border rounded-none"
                  />
                </div>
              </div>
              <p className="text-[0.6rem] text-zay-text-muted italic">
                Expiration et limite sont optionnelles.
              </p>
            </div>
            <DialogFooter className="border-t border-zay-border px-5 py-3">
              <Button
                type="submit"
                disabled={saving || !form.code.trim() || !form.value}
                className="w-full bg-primary text-white rounded-none h-10 text-[0.65rem] font-bold uppercase tracking-widest"
              >
                {editing ? 'Mettre à jour' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
