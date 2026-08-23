"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Tag, Calendar, Trash2, Loader2, Edit2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
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
import { notifyError } from '@/lib/notify';
import { useCachedResource } from '@/hooks/use-cached-resource';

const emptyForm = {
  code: '',
  type: 'PERCENTAGE' as PromoType,
  value: '',
  expiresAt: '',
  usageLimit: '',
};

export default function AdminPromosPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiPromo | null>(null);
  const { data: promoList, loading, refetch: load } = useCachedResource<ApiPromo[]>(
    'admin:promos',
    fetchPromos,
  );
  const promos = promoList ?? [];
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const handleCreate = async () => {
    if (!form.code.trim() || !form.value || saving) return;
    setSaving(true);
    try {
      await createPromo({
        code: form.code.trim(),
        type: form.type,
        value: parseFloat(form.value) || 0,
        expiresAt: form.expiresAt
          ? new Date(`${form.expiresAt}T23:59:59`).toISOString()
          : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : null,
        active: true,
      });
      setIsAddModalOpen(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      notifyError(err, 'Erreur création promo');
    } finally {
      setSaving(false);
    }
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
  };

  const handleUpdate = async () => {
    if (!editing || !form.code.trim() || !form.value || saving) return;
    setSaving(true);
    try {
      await updatePromo(editing.id, {
        code: form.code.trim(),
        type: form.type,
        value: parseFloat(form.value) || 0,
        expiresAt: form.expiresAt
          ? new Date(`${form.expiresAt}T23:59:59`).toISOString()
          : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : null,
      });
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch (err) {
      notifyError(err, 'Erreur mise à jour promo');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (promo: ApiPromo) => {
    try {
      await updatePromo(promo.id, { active: !promo.active });
      await load();
    } catch (err) {
      notifyError(err, 'Erreur mise à jour');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePromo(id);
      await load();
    } catch (err) {
      notifyError(err, 'Erreur suppression');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline italic">Codes Promo</h1>
          <p className="text-zay-text-muted text-xs tracking-widest uppercase italic mt-1">Marketing et fidélisation</p>
        </div>
        
        <Dialog
          open={isAddModalOpen}
          onOpenChange={(open) => {
            setIsAddModalOpen(open);
            if (!open) document.body.style.pointerEvents = '';
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-zay-text text-white rounded-none px-6 py-6 text-[0.65rem] tracking-[0.2em] font-bold uppercase shadow-xl shadow-primary/20 transition-all">
              <Plus className="w-4 h-4 mr-2" /> Créer un code
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border-zay-border shadow-2xl max-w-md p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-headline italic">Nouveau Code Promo</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Code</Label>
                <Input
                  placeholder="ex: ETE2024"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="h-12 border-zay-border rounded-none tracking-widest font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Type</Label>
                  <select
                    className="w-full h-12 border-zay-border rounded-none text-xs font-bold uppercase tracking-widest px-4"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as PromoType })}
                  >
                    <option value="PERCENTAGE">Pourcentage (%)</option>
                    <option value="AMOUNT">Montant fixe (€)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Valeur</Label>
                  <Input
                    placeholder="15"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="h-12 border-zay-border rounded-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Date d'expiration</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="h-12 border-zay-border rounded-none"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zay-text-muted pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Limite d'utilisation</Label>
                <Input
                  placeholder="100 (laisser vide pour illimité)"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  className="h-12 border-zay-border rounded-none"
                />
              </div>
            </div>
            <DialogFooter className="mt-8 flex gap-3 sm:justify-end">
              <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} className="rounded-none text-[0.65rem] font-bold uppercase tracking-widest">Annuler</Button>
              <Button disabled={saving} onClick={handleCreate} className="bg-primary hover:bg-zay-text text-white rounded-none px-8 h-12 text-[0.65rem] font-bold uppercase tracking-widest">
                {saving ? <Loader2 className="animate-spin" /> : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-zay-border shadow-sm overflow-hidden">
        {loading && !promoList ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : promos.length === 0 ? (
          <div className="p-12 text-center italic text-zay-text-muted text-sm">Aucun code promo.</div>
        ) : (
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
              <TableRow key={promo.id} className="hover:bg-zay-main transition-colors group">
                <TableCell className="pl-6 py-6">
                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold tracking-widest uppercase">{promo.code}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-xs font-bold text-primary">{formatPromoValue(promo)}</p>
                  <p className="text-[0.6rem] text-zay-text-muted uppercase tracking-tighter">{promo.type === 'PERCENTAGE' ? 'De remise (%)' : 'Remise fixe'}</p>
                </TableCell>
                <TableCell className="text-xs italic text-zay-text-muted">{formatPromoExpiration(promo.expiresAt)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold tabular-nums">{usages} / {limit}</span>
                    <div className="w-16 h-1 bg-zay-gray mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: limit === '∞' ? '10%' : `${Math.min(100, (usages / (limit as number)) * 100)}%` }} 
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
                      onClick={() => void handleDelete(promo.id)}
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
        )}
      </div>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setForm(emptyForm);
            document.body.style.pointerEvents = '';
          }
        }}
      >
        <DialogContent className="rounded-none border-zay-border shadow-2xl max-w-md p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-headline italic">Modifier le code</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="h-12 border-zay-border rounded-none tracking-widest font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Type</Label>
                <select
                  className="w-full h-12 border-zay-border rounded-none text-xs font-bold uppercase tracking-widest px-4"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as PromoType })}
                >
                  <option value="PERCENTAGE">Pourcentage (%)</option>
                  <option value="AMOUNT">Montant fixe (€)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Valeur</Label>
                <Input
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="h-12 border-zay-border rounded-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Date d&apos;expiration</Label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="h-12 border-zay-border rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Limite d&apos;utilisation</Label>
              <Input
                placeholder="vide = illimité"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                className="h-12 border-zay-border rounded-none"
              />
            </div>
          </div>
          <DialogFooter className="mt-8 flex gap-3 sm:justify-end">
            <Button variant="ghost" onClick={() => setEditing(null)} className="rounded-none text-[0.65rem] font-bold uppercase tracking-widest">
              Annuler
            </Button>
            <Button disabled={saving} onClick={() => void handleUpdate()} className="bg-primary hover:bg-zay-text text-white rounded-none px-8 h-12 text-[0.65rem] font-bold uppercase tracking-widest">
              {saving ? <Loader2 className="animate-spin" /> : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
