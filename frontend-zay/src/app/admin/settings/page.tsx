"use client"

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, User, Server, Store } from 'lucide-react';
import { changePassword, fetchMe, updateProfile } from '@/lib/api/auth';
import { getSessionUser } from '@/lib/auth/session';
import { API_BASE_URL, API_ORIGIN } from '@/lib/api/config';
import { fetchStoreSettings, updateStoreSettings } from '@/lib/api/store-settings';
import { notifyError, notifySuccess } from '@/lib/notify';
import { AdminBusyOverlay } from '@/components/admin/admin-busy-overlay';
import { cn } from '@/lib/utils';

function sanitizeMoney(raw: string): string {
  if (raw.trim() === '') return '';
  const n = Number(raw.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return '0';
  return raw;
}

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
      notifySuccess('Profil administrateur mis à jour.');
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
        shippingCost: Math.max(0, parseFloat(store.shippingCost) || 0),
        freeShippingThreshold: store.freeShippingThreshold.trim()
          ? Math.max(0, parseFloat(store.freeShippingThreshold))
          : null,
      });
      setStore({
        storeName: s.storeName || 'ZAY',
        contactEmail: s.contactEmail || '',
        shippingCost: String(s.shippingCost ?? 0),
        freeShippingThreshold:
          s.freeShippingThreshold != null ? String(s.freeShippingThreshold) : '',
      });
      notifySuccess('Paramètres boutique enregistrés.');
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
      notifyError(new Error('Les mots de passe ne correspondent pas.'));
      return;
    }
    setPwdSaving(true);
    try {
      await changePassword({
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
      notifySuccess('Mot de passe modifié.');
    } catch (err) {
      notifyError(err, 'Erreur mot de passe');
    } finally {
      setPwdSaving(false);
    }
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      notifySuccess('Adresse copiée.');
    } catch {
      notifyError('Impossible de copier');
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-[360px]">
        <AdminBusyOverlay show label="Chargement de la configuration…" />
      </div>
    );
  }

  const pwdMismatch =
    pwd.confirmPassword.length > 0 && pwd.newPassword !== pwd.confirmPassword;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-headline italic">Configuration</h1>
        <p className="text-zay-text-muted text-xs tracking-widest uppercase italic mt-1">
          Boutique, compte admin et connexion API
        </p>
      </div>

      <section className="relative bg-white border border-zay-border shadow-sm overflow-hidden">
        <AdminBusyOverlay show={storeSaving} label="Enregistrement…" />
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zay-border">
          <Store size={16} className="text-primary" />
          <h2 className="text-[0.65rem] font-bold uppercase tracking-widest">Boutique</h2>
        </div>
        <form onSubmit={handleSaveStore}>
          <div className="px-5 py-4 grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                Nom boutique
              </Label>
              <Input
                value={store.storeName}
                onChange={(e) => setStore({ ...store, storeName: e.target.value })}
                className="h-10 border-zay-border rounded-none"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                Email contact
              </Label>
              <Input
                type="email"
                value={store.contactEmail}
                onChange={(e) => setStore({ ...store, contactEmail: e.target.value })}
                className="h-10 border-zay-border rounded-none"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                Frais de port (€)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={store.shippingCost}
                onChange={(e) =>
                  setStore({ ...store, shippingCost: sanitizeMoney(e.target.value) })
                }
                className="h-10 border-zay-border rounded-none"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                Livraison offerte dès (€)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Vide = jamais"
                value={store.freeShippingThreshold}
                onChange={(e) =>
                  setStore({
                    ...store,
                    freeShippingThreshold: sanitizeMoney(e.target.value),
                  })
                }
                className="h-10 border-zay-border rounded-none"
              />
            </div>
          </div>
          <div className="border-t border-zay-border px-5 py-3">
            <Button
              type="submit"
              disabled={storeSaving}
              className="w-full bg-primary hover:bg-zay-text text-white rounded-none h-10 text-[0.65rem] font-bold uppercase tracking-widest"
            >
              Enregistrer la boutique
            </Button>
          </div>
        </form>
      </section>

      <section className="relative bg-white border border-zay-border shadow-sm overflow-hidden">
        <AdminBusyOverlay show={saving} label="Enregistrement…" />
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-zay-border">
          <div className="flex items-center gap-3">
            <User size={16} className="text-primary" />
            <h2 className="text-[0.65rem] font-bold uppercase tracking-widest">
              Profil administrateur
            </h2>
          </div>
          <Badge className="rounded-none text-[0.5rem] tracking-[0.1em] font-bold uppercase bg-zay-rose-pale text-primary">
            {form.role}
          </Badge>
        </div>
        <form onSubmit={handleSaveProfile}>
          <div className="px-5 py-4 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                  Prénom
                </Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="h-10 border-zay-border rounded-none"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                  Nom
                </Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="h-10 border-zay-border rounded-none"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                  Email
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  disabled
                  className="h-10 border-zay-border rounded-none opacity-70"
                />
                <p className="text-[0.55rem] text-zay-text-muted italic">Lecture seule</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                  Téléphone
                </Label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-10 border-zay-border rounded-none"
                />
              </div>
            </div>
          </div>
          <div className="border-t border-zay-border px-5 py-3">
            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-primary hover:bg-zay-text text-white rounded-none h-10 text-[0.65rem] font-bold uppercase tracking-widest"
            >
              Enregistrer le profil
            </Button>
          </div>
        </form>
      </section>

      <section className="relative bg-white border border-zay-border shadow-sm overflow-hidden">
        <AdminBusyOverlay show={pwdSaving} label="Mise à jour…" />
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zay-border">
          <ShieldCheck size={16} className="text-primary" />
          <h2 className="text-[0.65rem] font-bold uppercase tracking-widest">Sécurité</h2>
        </div>
        <form onSubmit={handleChangePassword}>
          <div className="px-5 py-4 space-y-4">
            <div className="space-y-1">
              <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                Mot de passe actuel
              </Label>
              <Input
                type="password"
                required
                minLength={8}
                value={pwd.currentPassword}
                onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
                className="h-10 border-zay-border rounded-none"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                  Nouveau
                </Label>
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={pwd.newPassword}
                  onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
                  className="h-10 border-zay-border rounded-none"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                  Confirmer
                </Label>
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={pwd.confirmPassword}
                  onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })}
                  className={cn(
                    'h-10 border-zay-border rounded-none',
                    pwdMismatch && 'border-red-400',
                  )}
                />
              </div>
            </div>
            {pwdMismatch && (
              <p className="text-[0.65rem] text-red-500">
                Les deux mots de passe ne correspondent pas.
              </p>
            )}
          </div>
          <div className="border-t border-zay-border px-5 py-3">
            <Button
              type="submit"
              disabled={pwdSaving || pwdMismatch}
              variant="outline"
              className="w-full border-zay-text text-zay-text rounded-none h-10 text-[0.65rem] font-bold uppercase tracking-widest hover:bg-zay-text hover:text-white"
            >
              Modifier le mot de passe
            </Button>
          </div>
        </form>
      </section>

      <section className="bg-zay-main/40 border border-zay-border p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Server size={16} className="text-zay-text-muted" />
            <h2 className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">
              API backend
            </h2>
          </div>
          <Badge
            className={cn(
              'rounded-none text-[0.5rem] tracking-[0.1em] font-bold uppercase',
              apiStatus === 'loading'
                ? 'bg-zay-gray text-zay-text-muted'
                : apiStatus === 'ok'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700',
            )}
          >
            {apiStatus === 'loading'
              ? 'Vérification…'
              : apiStatus === 'ok'
                ? 'Connecté'
                : 'Hors ligne'}
          </Badge>
        </div>
        <p className="text-[0.6rem] text-zay-text-muted italic">
          Lecture seule — adresses utilisées par l’admin.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
              Base API
            </p>
            <button
              type="button"
              onClick={() => void copy(API_BASE_URL)}
              className="w-full text-left font-mono text-[0.65rem] break-all text-zay-text hover:text-primary"
              title="Copier"
            >
              {API_BASE_URL}
            </button>
          </div>
          <div className="space-y-1">
            <p className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
              Origine uploads
            </p>
            <button
              type="button"
              onClick={() => void copy(API_ORIGIN)}
              className="w-full text-left font-mono text-[0.65rem] break-all text-zay-text hover:text-primary"
              title="Copier"
            >
              {API_ORIGIN}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
