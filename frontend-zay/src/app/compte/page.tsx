"use client"

import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Mail, Loader2 } from 'lucide-react';
import { changePassword, fetchMe, updateProfile } from '@/lib/api/auth';
import { getSessionUser } from '@/lib/auth/session';
import { notify, notifyError } from '@/lib/notify';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [pwd, setPwd] = useState({
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    const session = getSessionUser();
    if (session) {
      setForm({
        firstName: session.firstName || '',
        lastName: session.lastName || '',
        email: session.email || '',
        phone: session.phone || '',
      });
    }
    void fetchMe()
      .then((user) => {
        setForm({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
        });
      })
      .catch(() => {
        /* layout redirige si session invalide */
      })
      .finally(() => setLoading(false));
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
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      notify('Profil mis à jour');
    } catch (err) {
      notifyError(err, 'Erreur mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdSaving) return;
    setPwdSaving(true);
    try {
      await changePassword(pwd);
      setPwd({ currentPassword: '', newPassword: '' });
      notify('Mot de passe modifié');
    } catch (err) {
      notifyError(err, 'Erreur mot de passe');
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-12 md:space-y-16">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-headline italic">Mon Profil</h1>
        <p className="text-zay-text-muted tracking-widest text-[0.65rem] md:text-xs italic">Gérez vos informations personnelles et votre sécurité</p>
      </div>

      <div className="grid lg:grid-cols-1 gap-10 md:gap-12 max-w-2xl">
        <section className="space-y-6 md:space-y-8">
          <div className="flex items-center gap-3 pb-2 border-b border-zay-border">
            <Mail size={16} className="text-primary" />
            <h2 className="text-[0.65rem] tracking-[0.2em] font-bold uppercase">Informations Générales</h2>
          </div>
          
          <form onSubmit={handleSaveProfile} className="space-y-5 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              <div className="space-y-2">
                <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-bold text-zay-text-muted">Prénom</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="h-11 md:h-12 border-zay-border rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-bold text-zay-text-muted">Nom</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="h-11 md:h-12 border-zay-border rounded-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-bold text-zay-text-muted">Email</Label>
              <Input
                type="email"
                value={form.email}
                disabled
                className="h-11 md:h-12 border-zay-border rounded-none opacity-70"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-bold text-zay-text-muted">Téléphone</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-11 md:h-12 border-zay-border rounded-none"
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full md:w-auto bg-zay-text hover:bg-primary text-white px-10 md:px-12 py-6 md:py-7 rounded-none text-[0.65rem] md:text-[0.7rem] tracking-[0.3em] font-bold uppercase transition-all"
            >
              {saving ? <Loader2 className="animate-spin" /> : 'Sauvegarder'}
            </Button>
          </form>
        </section>

        <section className="space-y-6 md:space-y-8 pt-10 md:pt-12 border-t border-zay-border">
          <div className="flex items-center gap-3 pb-2 border-b border-zay-border">
            <ShieldCheck size={16} className="text-primary" />
            <h2 className="text-[0.65rem] tracking-[0.3em] font-bold uppercase">Sécurité</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5 md:space-y-6">
            <p className="text-[0.65rem] md:text-xs text-zay-text-muted italic tracking-wide">Changez votre mot de passe pour assurer la sécurité de votre compte.</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-bold text-zay-text-muted">Mot de passe actuel</Label>
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={pwd.currentPassword}
                  onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="h-11 md:h-12 border-zay-border rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-bold text-zay-text-muted">Nouveau mot de passe</Label>
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={pwd.newPassword}
                  onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="h-11 md:h-12 border-zay-border rounded-none"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={pwdSaving}
              variant="outline"
              className="w-full md:w-auto border-zay-text text-zay-text px-10 md:px-12 py-6 md:py-7 rounded-none text-[0.65rem] md:text-[0.7rem] tracking-[0.3em] font-bold uppercase transition-all hover:bg-zay-text hover:text-white"
            >
              {pwdSaving ? <Loader2 className="animate-spin" /> : 'Modifier le mot de passe'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
