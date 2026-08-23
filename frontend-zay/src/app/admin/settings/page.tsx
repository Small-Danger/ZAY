"use client"

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, User, Loader2, Server, Store } from 'lucide-react';
import { changePassword, fetchMe, updateProfile } from '@/lib/api/auth';
import { getSessionUser } from '@/lib/auth/session';
import { API_BASE_URL, API_ORIGIN } from '@/lib/api/config';
import { fetchStoreSettings, updateStoreSettings } from '@/lib/api/store-settings';
import { notify, notifyError } from '@/lib/notify';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(() => !getSessionUser());
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [storeSaving, setStoreSaving] = useState(false);
  const [apiStatus, setApiStatus] = useState<'ok' | 'down' | 'loading'>('loading');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'ADMIN' as string,
  });
  const [pwd, setPwd] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [store, setStore] = useState({
    storeName: 'ZAY',
    contactEmail: '',
    shippingCost: '0',
    freeShippingThreshold: '',
  });

  useEffect(() => {
    const session = getSessionUser();
    if (session) {
      setForm({
        firstName: session.firstName || '',
        lastName: session.lastName || '',
        email: session.email || '',
        phone: session.phone || '',
        role: session.role,
      });
    }

    void Promise.all([
      fetchMe()
        .then((user) => {
          setForm({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role,
          });
        })
        .catch(() => {
          /* layout redirige si session invalide */
        }),
      fetchStoreSettings()
        .then((s) => {
          setStore({
            storeName: s.storeName || 'ZAY',
            contactEmail: s.contactEmail || '',
            shippingCost: String(s.shippingCost ?? 0),
            freeShippingThreshold:
              s.freeShippingThreshold != null ? String(s.freeShippingThreshold) : '',
          });
        })
        .catch(() => {
          /* ignore si migration pas encore appliquée */
        }),
    ]).finally(() => setLoading(false));

    void fetch(`${API_BASE_URL}/health`)
      .then(async (res) => {
        if (!res.ok) throw new Error('down');
        const data = await res.json();
        setApiStatus(data?.status === 'ok' ? 'ok' : 'down');
      })
      .catch(() => setApiStatus('down'));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const user = await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      });
      setForm((prev) => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role,
      }));
      notify('Profil admin mis à jour');
    } catch (err) {
      notifyError(err, 'Erreur mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (storeSaving) return;
    setStoreSaving(true);
    try {
      const s = await updateStoreSettings({
        storeName: store.storeName.trim() || 'ZAY',
        contactEmail: store.contactEmail.trim() || null,
        shippingCost: parseFloat(store.shippingCost) || 0,
        freeShippingThreshold: store.freeShippingThreshold.trim()
          ? parseFloat(store.freeShippingThreshold)
          : null,
      });
      setStore({
        storeName: s.storeName || 'ZAY',
        contactEmail: s.contactEmail || '',
        shippingCost: String(s.shippingCost ?? 0),
        freeShippingThreshold:
          s.freeShippingThreshold != null ? String(s.freeShippingThreshold) : '',
      });
      notify('Paramètres boutique enregistrés');
    } catch (err) {
      notifyError(err, 'Erreur boutique');
    } finally {
      setStoreSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdSaving) return;
    if (pwd.newPassword !== pwd.confirmPassword) {
      notify('Les mots de passe ne correspondent pas.');
      return;
    }
    setPwdSaving(true);
    try {
      await changePassword({
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
      notify('Mot de passe modifié');
    } catch (err) {
      notifyError(err, 'Erreur mot de passe');
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-headline italic">Configuration</h1>
        <p className="text-zay-text-muted text-xs tracking-widest uppercase italic mt-1">
          Boutique, compte admin et connexion API
        </p>
      </div>

      <section className="bg-white border border-zay-border shadow-sm p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zay-border">
          <Store size={16} className="text-primary" />
          <h2 className="text-[0.65rem] font-bold uppercase tracking-widest">Boutique</h2>
        </div>
        <form onSubmit={handleSaveStore} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Nom boutique</Label>
              <Input
                value={store.storeName}
                onChange={(e) => setStore({ ...store, storeName: e.target.value })}
                className="h-12 border-zay-border rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Email contact</Label>
              <Input
                type="email"
                value={store.contactEmail}
                onChange={(e) => setStore({ ...store, contactEmail: e.target.value })}
                className="h-12 border-zay-border rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Frais de port (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={store.shippingCost}
                onChange={(e) => setStore({ ...store, shippingCost: e.target.value })}
                className="h-12 border-zay-border rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Livraison offerte dès (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="vide = jamais"
                value={store.freeShippingThreshold}
                onChange={(e) => setStore({ ...store, freeShippingThreshold: e.target.value })}
                className="h-12 border-zay-border rounded-none"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={storeSaving}
            className="bg-primary hover:bg-zay-text text-white rounded-none px-10 h-12 text-[0.65rem] font-bold uppercase tracking-widest"
          >
            {storeSaving ? <Loader2 className="animate-spin" /> : 'Enregistrer la boutique'}
          </Button>
        </form>
      </section>

      <section className="bg-white border border-zay-border shadow-sm p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zay-border">
          <Server size={16} className="text-primary" />
          <h2 className="text-[0.65rem] font-bold uppercase tracking-widest">API Backend</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-zay-text-muted mb-1">Base API</p>
            <p className="font-mono text-[0.7rem] break-all">{API_BASE_URL}</p>
          </div>
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-zay-text-muted mb-1">Origine uploads</p>
            <p className="font-mono text-[0.7rem] break-all">{API_ORIGIN}</p>
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-zay-text-muted">Statut</p>
            {apiStatus === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Badge
                className={
                  apiStatus === 'ok'
                    ? 'rounded-none text-[0.5rem] tracking-[0.1em] font-bold uppercase bg-green-100 text-green-700'
                    : 'rounded-none text-[0.5rem] tracking-[0.1em] font-bold uppercase bg-red-100 text-red-700'
                }
              >
                {apiStatus === 'ok' ? 'Connecté' : 'Hors ligne'}
              </Badge>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white border border-zay-border shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-zay-border">
          <div className="flex items-center gap-3">
            <User size={16} className="text-primary" />
            <h2 className="text-[0.65rem] font-bold uppercase tracking-widest">Profil administrateur</h2>
          </div>
          <Badge className="rounded-none text-[0.5rem] tracking-[0.1em] font-bold uppercase bg-zay-rose-pale text-primary">
            {form.role}
          </Badge>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Prénom</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="h-12 border-zay-border rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Nom</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="h-12 border-zay-border rounded-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Email</Label>
            <Input
              type="email"
              value={form.email}
              disabled
              className="h-12 border-zay-border rounded-none opacity-70"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Téléphone</Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="h-12 border-zay-border rounded-none"
            />
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-zay-text text-white rounded-none px-10 h-12 text-[0.65rem] font-bold uppercase tracking-widest"
          >
            {saving ? <Loader2 className="animate-spin" /> : 'Enregistrer le profil'}
          </Button>
        </form>
      </section>

      <section className="bg-white border border-zay-border shadow-sm p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zay-border">
          <ShieldCheck size={16} className="text-primary" />
          <h2 className="text-[0.65rem] font-bold uppercase tracking-widest">Sécurité</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Mot de passe actuel</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={pwd.currentPassword}
              onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
              className="h-12 border-zay-border rounded-none"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Nouveau</Label>
              <Input
                type="password"
                required
                minLength={8}
                value={pwd.newPassword}
                onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
                className="h-12 border-zay-border rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Confirmer</Label>
              <Input
                type="password"
                required
                minLength={8}
                value={pwd.confirmPassword}
                onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })}
                className="h-12 border-zay-border rounded-none"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={pwdSaving}
            variant="outline"
            className="border-zay-text text-zay-text rounded-none px-10 h-12 text-[0.65rem] font-bold uppercase tracking-widest hover:bg-zay-text hover:text-white"
          >
            {pwdSaving ? <Loader2 className="animate-spin" /> : 'Modifier le mot de passe'}
          </Button>
        </form>
      </section>
    </div>
  );
}
