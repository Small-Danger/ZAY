"use client"

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Trash2, Edit2, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  setDefaultAddress,
  updateAddress,
  type ApiAddress,
} from '@/lib/api/addresses';
import { notify, notifyError } from '@/lib/notify';

const emptyForm = {
  name: '',
  street: '',
  city: '',
  zip: '',
  country: 'France',
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiAddress | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAddresses(await fetchAddresses());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur chargement adresses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsAddModalOpen(true);
  };

  const openEdit = (addr: ApiAddress) => {
    setEditing(addr);
    setForm({
      name: addr.name,
      street: addr.street,
      city: addr.city,
      zip: addr.zip,
      country: addr.country || 'France',
    });
    setIsAddModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.street.trim() || !form.city.trim() || !form.zip.trim()) {
      notify('Merci de remplir tous les champs.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateAddress(editing.id, form);
      } else {
        await createAddress({
          ...form,
          isDefault: addresses.length === 0,
        });
      }
      setIsAddModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch (err) {
      notifyError(err, 'Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAddress(id);
      await load();
    } catch (err) {
      notifyError(err, 'Erreur suppression');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      await load();
    } catch (err) {
      notifyError(err, 'Erreur');
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-headline italic">Mes Adresses</h1>
          <p className="text-zay-text-muted tracking-widest text-xs italic">Gérez vos lieux de livraison favoris</p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) {
            setEditing(null);
            setForm(emptyForm);
          }
        }}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreate}
              className="bg-primary hover:bg-zay-text text-white rounded-none px-8 py-6 text-[0.65rem] tracking-[0.2em] font-bold uppercase shadow-xl shadow-primary/10 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" /> Ajouter une adresse
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border-zay-border shadow-2xl max-w-md p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-headline italic">
                {editing ? 'Modifier l’adresse' : 'Nouvelle Adresse'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Nom de l&apos;adresse</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="ex: Domicile, Bureau..."
                  className="h-12 border-zay-border rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Rue et Numéro</Label>
                <Input
                  required
                  value={form.street}
                  onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                  placeholder="123 rue de Rivoli"
                  className="h-12 border-zay-border rounded-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Code Postal</Label>
                  <Input
                    required
                    value={form.zip}
                    onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                    placeholder="75001"
                    className="h-12 border-zay-border rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Ville</Label>
                  <Input
                    required
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="Paris"
                    className="h-12 border-zay-border rounded-none"
                  />
                </div>
              </div>
              <DialogFooter className="mt-8 flex gap-3 sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} className="rounded-none text-[0.65rem] font-bold uppercase tracking-widest">Annuler</Button>
                <Button type="submit" disabled={saving} className="bg-primary hover:bg-zay-text text-white rounded-none px-8 h-12 text-[0.65rem] font-bold uppercase tracking-widest">
                  {saving ? <Loader2 className="animate-spin" /> : 'Enregistrer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>
      ) : error ? (
        <p className="text-sm text-red-500 italic">{error}</p>
      ) : addresses.length === 0 ? (
        <p className="text-sm text-zay-text-muted italic">Aucune adresse enregistrée.</p>
      ) : (
      <div className="grid md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {addresses.map((address) => (
            <motion.div 
              key={address.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "border p-8 space-y-4 relative group transition-all duration-300",
                address.isDefault ? "border-primary bg-zay-rose-pale/30" : "border-zay-border hover:border-zay-text"
              )}
            >
              {address.isDefault && (
                <div className="absolute top-6 right-8 flex items-center gap-1.5 text-primary">
                  <Check size={14} strokeWidth={3} />
                  <span className="text-[0.55rem] tracking-[0.2em] font-bold uppercase">Principale</span>
                </div>
              )}
              
              <div className="flex items-center gap-3 text-zay-text">
                <MapPin size={18} className={address.isDefault ? "text-primary" : "text-zay-text-muted"} />
                <h3 className="text-sm font-bold uppercase tracking-widest">{address.name}</h3>
              </div>

              <div className="space-y-1 text-zay-text-muted text-xs italic leading-relaxed tracking-wide">
                <p>{address.street}</p>
                <p>{address.zip} {address.city}</p>
                <p>{address.country}</p>
              </div>

              <div className="flex flex-wrap gap-6 pt-4 border-t border-zay-border/50">
                <button
                  type="button"
                  onClick={() => openEdit(address)}
                  className="text-[0.6rem] font-bold uppercase text-primary hover:underline flex items-center gap-2"
                >
                  <Edit2 size={12} /> Modifier
                </button>
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address.id)}
                    className="text-[0.6rem] font-bold uppercase text-zay-text-muted hover:text-primary flex items-center gap-2"
                  >
                    <Check size={12} /> Principale
                  </button>
                )}
                {!address.isDefault && (
                  <button 
                    type="button"
                    onClick={() => handleDelete(address.id)}
                    className="text-[0.6rem] font-bold uppercase text-zay-text-muted hover:text-red-500 flex items-center gap-2"
                  >
                    <Trash2 size={12} /> Supprimer
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      )}
    </div>
  );
}
