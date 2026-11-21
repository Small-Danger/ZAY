"use client"

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ShieldCheck, User, Store } from 'lucide-react';
import { changePassword, fetchMe, updateProfile } from '@/lib/api/auth';
import { getSessionUser } from '@/lib/auth/session';
import {
  fetchStoreSettings,
  updateStoreSettings,
  type StoreSettings,
} from '@/lib/api/store-settings';
import { notifyError, notifySuccess } from '@/lib/notify';
import { AdminBusyOverlay } from '@/components/admin/admin-busy-overlay';
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/api/config';

function sanitizeMoney(raw: string): string {
  if (raw.trim() === '') return '';
  const n = Number(raw.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return '0';
  return raw;
}

function emptyStoreForm() {
  return {
    storeName: 'ZAY',
    contactEmail: '',
    shippingCost: '0',
    freeShippingThreshold: '',
    legalName: '',
    tradeName: '',
    legalForm: '',
    shareCapital: '',
    siret: '',
    rcsCity: '',
    vatNumber: '',
    vatFranchise: true,
    legalAddress: '',
    publicationDirector: '',
    contactPhone: '',
    showroomAddress: '',
    openingHours: '',
    hostName: 'Railway Corporation',
    hostAddress: '',
    hostContact: '',
    mediatorName: '',
    mediatorUrl: '',
    instagramUrl: '',
    tiktokUrl: '',
    eventTitle: '',
    eventSubtitle: '',
    eventDate: '',
    eventImageUrl: '',
    eventLink: '',
    eventPartners: '',
  };
}

function fromApi(s: StoreSettings) {
  return {
    storeName: s.storeName || 'ZAY',
    contactEmail: s.contactEmail || '',
    shippingCost: String(s.shippingCost ?? 0),
    freeShippingThreshold:
      s.freeShippingThreshold != null ? String(s.freeShippingThreshold) : '',
    legalName: s.legalName || '',
    tradeName: s.tradeName || '',
    legalForm: s.legalForm || '',
    shareCapital: s.shareCapital || '',
    siret: s.siret || '',
    rcsCity: s.rcsCity || '',
    vatNumber: s.vatNumber || '',
    vatFranchise: s.vatFranchise !== false,
    legalAddress: s.legalAddress || '',
    publicationDirector: s.publicationDirector || '',
    contactPhone: s.contactPhone || '',
    showroomAddress: s.showroomAddress || '',
    openingHours: s.openingHours || '',
    hostName: s.hostName || 'Railway Corporation',
    hostAddress: s.hostAddress || '',
    hostContact: s.hostContact || '',
    mediatorName: s.mediatorName || '',
    mediatorUrl: s.mediatorUrl || '',
    instagramUrl: s.instagramUrl || '',
    tiktokUrl: s.tiktokUrl || '',
    eventTitle: s.eventTitle || '',
    eventSubtitle: s.eventSubtitle || '',
    eventDate: s.eventDate ? s.eventDate.slice(0, 16) : '',
    eventImageUrl: s.eventImageUrl || '',
    eventLink: s.eventLink || '',
    eventPartners: s.eventPartners || '',
  };
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
        {label}
      </Label>
      {children}
      {hint ? (
        <p className="text-[0.55rem] text-zay-text-muted font-light leading-relaxed">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const inputClass = 'h-10 border-zay-border rounded-none';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(() => !getSessionUser());
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [storeSaving, setStoreSaving] = useState(false);
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
  const [store, setStore] = useState(emptyStoreForm);

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
        .then((s) => setStore(fromApi(s)))
        .catch(() => {
          /* ignore */
        }),
    ]).finally(() => setLoading(false));
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
      const nullIfEmpty = (v: string) => (v.trim() ? v.trim() : null);
      const s = await updateStoreSettings({
        storeName: store.storeName.trim() || 'ZAY',
        contactEmail: nullIfEmpty(store.contactEmail),
        shippingCost: Math.max(0, parseFloat(store.shippingCost) || 0),
        freeShippingThreshold: store.freeShippingThreshold.trim()
          ? Math.max(0, parseFloat(store.freeShippingThreshold))
          : null,
        legalName: nullIfEmpty(store.legalName),
        tradeName: nullIfEmpty(store.tradeName),
        legalForm: nullIfEmpty(store.legalForm),
        shareCapital: nullIfEmpty(store.shareCapital),
        siret: nullIfEmpty(store.siret),
        rcsCity: nullIfEmpty(store.rcsCity),
        vatNumber: nullIfEmpty(store.vatNumber),
        vatFranchise: store.vatFranchise,
        legalAddress: nullIfEmpty(store.legalAddress),
        publicationDirector: nullIfEmpty(store.publicationDirector),
        contactPhone: nullIfEmpty(store.contactPhone),
        showroomAddress: nullIfEmpty(store.showroomAddress),
        openingHours: nullIfEmpty(store.openingHours),
        hostName: store.hostName.trim() || 'Railway Corporation',
        hostAddress: nullIfEmpty(store.hostAddress),
        hostContact: nullIfEmpty(store.hostContact),
        mediatorName: nullIfEmpty(store.mediatorName),
        mediatorUrl: nullIfEmpty(store.mediatorUrl),
        instagramUrl: nullIfEmpty(store.instagramUrl),
        tiktokUrl: nullIfEmpty(store.tiktokUrl),
        eventTitle: nullIfEmpty(store.eventTitle),
        eventSubtitle: nullIfEmpty(store.eventSubtitle),
        eventDate: store.eventDate.trim()
          ? new Date(store.eventDate).toISOString()
          : null,
        eventImageUrl: nullIfEmpty(store.eventImageUrl),
        eventLink: nullIfEmpty(store.eventLink),
        eventPartners: nullIfEmpty(store.eventPartners),
      });
      setStore(fromApi(s));
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

  if (loading) {
    return (
      <div className="relative min-h-[360px]">
        <AdminBusyOverlay show label="Chargement de la configuration…" />
      </div>
    );
  }

  const pwdMismatch =
    pwd.confirmPassword.length > 0 && pwd.newPassword !== pwd.confirmPassword;

  const set =
    (key: keyof ReturnType<typeof emptyStoreForm>) =>
    (value: string) =>
      setStore((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-headline italic">Configuration</h1>
        <p className="text-zay-text-muted text-xs tracking-widest uppercase italic mt-1">
          Boutique, profil et mot de passe
        </p>
      </div>

      <section className="relative bg-white border border-zay-border shadow-sm overflow-hidden">
        <AdminBusyOverlay show={storeSaving} label="Enregistrement…" />
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zay-border">
          <Store size={16} className="text-primary" />
          <h2 className="text-[0.65rem] font-bold uppercase tracking-widest">
            Boutique
          </h2>
        </div>
        <form onSubmit={handleSaveStore}>
          <div className="px-5 py-4 grid md:grid-cols-2 gap-4">
            <Field label="Nom boutique">
              <Input
                value={store.storeName}
                onChange={(e) => set('storeName')(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Email contact">
              <Input
                type="email"
                value={store.contactEmail}
                onChange={(e) => set('contactEmail')(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Frais de port (€)">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={store.shippingCost}
                onChange={(e) =>
                  set('shippingCost')(sanitizeMoney(e.target.value))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Livraison offerte dès (€)">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Vide = jamais"
                value={store.freeShippingThreshold}
                onChange={(e) =>
                  set('freeShippingThreshold')(sanitizeMoney(e.target.value))
                }
                className={inputClass}
              />
            </Field>
          </div>

          <Accordion type="multiple" className="border-t border-zay-border">
            <AccordionItem value="legal" className="px-5 border-b border-zay-border">
              <AccordionTrigger className="text-[0.65rem] font-bold uppercase tracking-widest hover:no-underline">
                Informations légales
              </AccordionTrigger>
              <AccordionContent className="grid md:grid-cols-2 gap-4 pb-4">
                <Field
                  label="Raison sociale"
                  hint="Micro-entreprise : prénom NOM suivi de EI"
                >
                  <Input value={store.legalName} onChange={(e) => set('legalName')(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Nom commercial">
                  <Input value={store.tradeName} onChange={(e) => set('tradeName')(e.target.value)} className={inputClass} placeholder="ex: ZAY" />
                </Field>
                <Field label="Forme juridique">
                  <Input value={store.legalForm} onChange={(e) => set('legalForm')(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Capital social">
                  <Input value={store.shareCapital} onChange={(e) => set('shareCapital')(e.target.value)} className={inputClass} />
                </Field>
                <Field label="SIRET">
                  <Input value={store.siret} onChange={(e) => set('siret')(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Ville RCS">
                  <Input value={store.rcsCity} onChange={(e) => set('rcsCity')(e.target.value)} className={inputClass} />
                </Field>
                <div className="md:col-span-2 flex items-start gap-3 py-1">
                  <input
                    id="vatFranchise"
                    type="checkbox"
                    checked={store.vatFranchise}
                    onChange={(e) =>
                      setStore((prev) => ({
                        ...prev,
                        vatFranchise: e.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <label htmlFor="vatFranchise" className="space-y-1 cursor-pointer">
                    <span className="block text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                      Franchise en base de TVA
                    </span>
                    <span className="block text-[0.55rem] text-zay-text-muted font-light">
                      Affiche « TVA non applicable, art. 293 B du CGI » (recommandé pour micro-entreprise).
                    </span>
                  </label>
                </div>
                {!store.vatFranchise && (
                  <Field label="N° TVA">
                    <Input value={store.vatNumber} onChange={(e) => set('vatNumber')(e.target.value)} className={inputClass} />
                  </Field>
                )}
                <Field label="Adresse légale">
                  <Textarea value={store.legalAddress} onChange={(e) => set('legalAddress')(e.target.value)} className="border-zay-border rounded-none min-h-[80px]" />
                </Field>
                <Field label="Directeur de la publication">
                  <Input value={store.publicationDirector} onChange={(e) => set('publicationDirector')(e.target.value)} className={inputClass} />
                </Field>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="contact" className="px-5 border-b border-zay-border">
              <AccordionTrigger className="text-[0.65rem] font-bold uppercase tracking-widest hover:no-underline">
                Contact & showroom
              </AccordionTrigger>
              <AccordionContent className="grid md:grid-cols-2 gap-4 pb-4">
                <Field label="Téléphone">
                  <Input value={store.contactPhone} onChange={(e) => set('contactPhone')(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Horaires">
                  <Textarea value={store.openingHours} onChange={(e) => set('openingHours')(e.target.value)} className="border-zay-border rounded-none min-h-[80px]" />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Adresse showroom">
                    <Textarea value={store.showroomAddress} onChange={(e) => set('showroomAddress')(e.target.value)} className="border-zay-border rounded-none min-h-[80px]" />
                  </Field>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="host" className="px-5 border-b border-zay-border">
              <AccordionTrigger className="text-[0.65rem] font-bold uppercase tracking-widest hover:no-underline">
                Hébergeur
              </AccordionTrigger>
              <AccordionContent className="grid md:grid-cols-2 gap-4 pb-4">
                <Field label="Nom">
                  <Input value={store.hostName} onChange={(e) => set('hostName')(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Contact">
                  <Input value={store.hostContact} onChange={(e) => set('hostContact')(e.target.value)} className={inputClass} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Adresse">
                    <Textarea value={store.hostAddress} onChange={(e) => set('hostAddress')(e.target.value)} className="border-zay-border rounded-none min-h-[80px]" />
                  </Field>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="mediator" className="px-5 border-b border-zay-border">
              <AccordionTrigger className="text-[0.65rem] font-bold uppercase tracking-widest hover:no-underline">
                Médiateur de la consommation
              </AccordionTrigger>
              <AccordionContent className="grid md:grid-cols-2 gap-4 pb-4">
                <Field label="Nom">
                  <Input value={store.mediatorName} onChange={(e) => set('mediatorName')(e.target.value)} className={inputClass} />
                </Field>
                <Field label="URL (https)">
                  <Input type="url" value={store.mediatorUrl} onChange={(e) => set('mediatorUrl')(e.target.value)} className={inputClass} />
                </Field>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="social" className="px-5 border-b border-zay-border">
              <AccordionTrigger className="text-[0.65rem] font-bold uppercase tracking-widest hover:no-underline">
                Réseaux sociaux
              </AccordionTrigger>
              <AccordionContent className="grid md:grid-cols-2 gap-4 pb-4">
                <Field label="Instagram (https)">
                  <Input type="url" value={store.instagramUrl} onChange={(e) => set('instagramUrl')(e.target.value)} className={inputClass} />
                </Field>
                <Field label="TikTok (https)">
                  <Input type="url" value={store.tiktokUrl} onChange={(e) => set('tiktokUrl')(e.target.value)} className={inputClass} />
                </Field>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="event" className="px-5">
              <AccordionTrigger className="text-[0.65rem] font-bold uppercase tracking-widest hover:no-underline">
                Événement à la une
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <p className="text-[0.65rem] text-zay-text-muted italic">
                  L&apos;événement disparaît automatiquement après sa date (s&apos;il
                  n&apos;y a pas de titre, la section n&apos;apparaît pas sur
                  l&apos;accueil).
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Titre">
                    <Input value={store.eventTitle} onChange={(e) => set('eventTitle')(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Sous-titre">
                    <Input value={store.eventSubtitle} onChange={(e) => set('eventSubtitle')(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Date">
                    <Input type="datetime-local" value={store.eventDate} onChange={(e) => set('eventDate')(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Lien (https)">
                    <Input type="url" value={store.eventLink} onChange={(e) => set('eventLink')(e.target.value)} className={inputClass} />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Image (URL https)">
                      <Input type="url" value={store.eventImageUrl} onChange={(e) => set('eventImageUrl')(e.target.value)} className={inputClass} />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Partenaires">
                      <Input value={store.eventPartners} onChange={(e) => set('eventPartners')(e.target.value)} className={inputClass} />
                    </Field>
                  </div>
                </div>
                {(store.eventTitle.trim() || store.eventImageUrl.trim()) && (
                  <div className="border border-zay-border p-4 space-y-2 bg-zay-gray/40">
                    <p className="text-[0.55rem] uppercase tracking-widest font-bold text-zay-text-muted">
                      Aperçu
                    </p>
                    {store.eventImageUrl.trim() && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveMediaUrl(store.eventImageUrl.trim())}
                        alt=""
                        className="w-full max-h-40 object-cover"
                      />
                    )}
                    <p className="font-headline italic text-lg">
                      {store.eventTitle || 'Sans titre'}
                    </p>
                    {store.eventSubtitle && (
                      <p className="text-sm text-zay-text-muted">
                        {store.eventSubtitle}
                      </p>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

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
              <Field label="Prénom">
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Nom">
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Email">
                <Input
                  type="email"
                  value={form.email}
                  disabled
                  className={cn(inputClass, 'opacity-70')}
                />
                <p className="text-[0.55rem] text-zay-text-muted italic">Lecture seule</p>
              </Field>
              <Field label="Téléphone">
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                />
              </Field>
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
          <h2 className="text-[0.65rem] font-bold uppercase tracking-widest">
            Sécurité
          </h2>
        </div>
        <form onSubmit={handleChangePassword}>
          <div className="px-5 py-4 space-y-4">
            <Field label="Mot de passe actuel">
              <Input
                type="password"
                required
                minLength={8}
                value={pwd.currentPassword}
                onChange={(e) =>
                  setPwd({ ...pwd, currentPassword: e.target.value })
                }
                className={inputClass}
              />
            </Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Nouveau">
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={pwd.newPassword}
                  onChange={(e) =>
                    setPwd({ ...pwd, newPassword: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Confirmer">
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={pwd.confirmPassword}
                  onChange={(e) =>
                    setPwd({ ...pwd, confirmPassword: e.target.value })
                  }
                  className={cn(inputClass, pwdMismatch && 'border-red-400')}
                />
              </Field>
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
    </div>
  );
}
