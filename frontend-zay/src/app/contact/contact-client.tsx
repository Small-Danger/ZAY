"use client"

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Instagram, ArrowRight, Sparkles, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { sendContactMessage, type ContactSubject } from '@/lib/api/contact';
import { notifyError, notifySuccess } from '@/lib/notify';
import { ZayBusyOverlay } from '@/components/ui/zay-busy-overlay';
import type { PublicStoreSettings } from '@/lib/api/store-settings-public';

const SUBJECT_OPTIONS: { label: string; value: ContactSubject }[] = [
  { label: 'Suivi de ma commande', value: 'ORDER_TRACKING' },
  { label: 'Conseil de stylisme', value: 'STYLING_ADVICE' },
  { label: 'Retours & Échanges', value: 'RETURNS_EXCHANGES' },
  { label: 'Partenariats média', value: 'MEDIA_PARTNERSHIP' },
  { label: 'Autre demande', value: 'OTHER' },
];

export function ContactClient({ settings }: { settings: PublicStoreSettings }) {
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: 'OTHER' as ContactSubject,
    message: '',
  });

  const email = settings.contactEmail?.trim() || null;
  const phone = settings.contactPhone?.trim() || null;
  const showroom = settings.showroomAddress?.trim() || null;
  const hours = settings.openingHours?.trim() || null;
  const instagram = settings.instagramUrl?.trim() || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await sendContactMessage(form);
      setSent(true);
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        subject: 'OTHER',
        message: '',
      });
      notifySuccess('Message envoyé — nous vous répondons sous 24h.');
    } catch (err) {
      notifyError(err, 'Erreur envoi message');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />
      <main className="flex-grow pt-44 md:pt-56 pb-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />

        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-20 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 mb-2"
            >
              <Sparkles className="w-4 h-4 text-primary glow-pink" />
              <span className="text-primary glow-pink text-[0.65rem] tracking-[0.6em] font-bold uppercase">
                Conciergerie
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-8xl font-headline italic text-white leading-none"
            >
              À votre <span className="text-primary glow-pink">écoute</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/60 tracking-[0.2em] max-w-xl mx-auto italic font-light text-sm mt-6"
            >
              Une question sur une commande ou besoin d&apos;un conseil
              personnalisé ? Notre équipe de stylistes vous répond sous 24h.
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-neutral-900/50 p-8 md:p-12 border border-white/5 shadow-2xl rounded-sm relative overflow-hidden group backdrop-blur-xl"
            >
              <ZayBusyOverlay show={saving} label="Envoi du message…" />
              <div className="absolute top-0 left-0 w-1 h-full bg-primary glow-pink opacity-50" />

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[0.65rem] tracking-[0.2em] uppercase font-bold text-white/50">
                      Prénom
                    </Label>
                    <Input
                      required
                      value={form.firstName}
                      onChange={(e) =>
                        setForm({ ...form, firstName: e.target.value })
                      }
                      className="bg-transparent border-white/10 border-t-0 border-x-0 rounded-none text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-primary h-12 px-0"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[0.65rem] tracking-[0.2em] uppercase font-bold text-white/50">
                      Nom
                    </Label>
                    <Input
                      required
                      value={form.lastName}
                      onChange={(e) =>
                        setForm({ ...form, lastName: e.target.value })
                      }
                      className="bg-transparent border-white/10 border-t-0 border-x-0 rounded-none text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-primary h-12 px-0"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[0.65rem] tracking-[0.2em] uppercase font-bold text-white/50">
                    Email
                  </Label>
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="bg-transparent border-white/10 border-t-0 border-x-0 rounded-none text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-primary h-12 px-0"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[0.65rem] tracking-[0.2em] uppercase font-bold text-white/50">
                    Sujet
                  </Label>
                  <select
                    value={form.subject}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        subject: e.target.value as ContactSubject,
                      })
                    }
                    className="w-full bg-transparent border-b border-white/10 text-white h-12 text-sm"
                  >
                    {SUBJECT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="text-black">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[0.65rem] tracking-[0.2em] uppercase font-bold text-white/50">
                    Message
                  </Label>
                  <Textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    className="bg-transparent border-white/10 rounded-none text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-primary"
                  />
                </div>
                {sent && (
                  <p className="text-sm italic text-primary">
                    Message envoyé — nous vous répondons sous 24h.
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-primary text-white hover:bg-white hover:text-black py-8 rounded-none text-[0.7rem] tracking-[0.4em] font-bold uppercase transition-all duration-500 shadow-xl shadow-primary/10 group"
                >
                  {saving ? (
                    'Envoi…'
                  ) : (
                    <>
                      ENVOYER LE MESSAGE{' '}
                      <ArrowRight
                        className="ml-3 w-4 h-4 transition-transform group-hover:translate-x-2"
                        strokeWidth={1.5}
                      />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>

            <div className="space-y-16 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-12"
              >
                {email && (
                  <div className="flex gap-8">
                    <div className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0 box-glow-pink">
                      <Mail size={22} strokeWidth={1.2} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[0.7rem] tracking-[0.3em] font-bold uppercase text-white">
                        Contact digital
                      </h3>
                      <p className="text-sm italic text-white/60 font-light tracking-widest">
                        {email}
                      </p>
                      <p className="text-[0.6rem] text-primary font-bold tracking-widest uppercase mt-1">
                        Réponse sous 24h
                      </p>
                    </div>
                  </div>
                )}

                {phone && (
                  <div className="flex gap-8">
                    <div className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0 box-glow-pink">
                      <Phone size={22} strokeWidth={1.2} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[0.7rem] tracking-[0.3em] font-bold uppercase text-white">
                        Téléphone
                      </h3>
                      <p className="text-sm italic text-white/60 font-light tracking-widest">
                        {phone}
                      </p>
                    </div>
                  </div>
                )}

                {showroom && (
                  <div className="flex gap-8">
                    <div className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0 box-glow-pink">
                      <MapPin size={22} strokeWidth={1.2} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[0.7rem] tracking-[0.3em] font-bold uppercase text-white">
                        Showroom
                      </h3>
                      <p className="text-sm italic text-white/60 font-light tracking-widest whitespace-pre-line">
                        {showroom}
                      </p>
                    </div>
                  </div>
                )}

                {hours && (
                  <div className="flex gap-8">
                    <div className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0 box-glow-pink">
                      <Clock size={22} strokeWidth={1.2} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[0.7rem] tracking-[0.3em] font-bold uppercase text-white">
                        Horaires
                      </h3>
                      <p className="text-sm italic text-white/60 font-light tracking-widest whitespace-pre-line">
                        {hours}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="pt-12 border-t border-white/10 space-y-8"
              >
                {instagram && (
                  <div className="space-y-4">
                    <h4 className="text-[0.7rem] tracking-[0.4em] font-bold uppercase text-primary glow-pink">
                      Rejoignez l&apos;univers
                    </h4>
                    <div className="flex gap-8">
                      <a
                        href={instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-3 text-white/60 hover:text-primary transition-colors text-xs italic font-medium tracking-widest"
                      >
                        <div className="p-2 rounded-full border border-white/10 group-hover:border-primary transition-colors">
                          <Instagram size={18} strokeWidth={1.2} />
                        </div>
                        Instagram
                      </a>
                    </div>
                  </div>
                )}

                <div className="bg-neutral-900 border border-white/5 p-8 rounded-none space-y-4 shadow-xl">
                  <p className="text-white text-[0.65rem] tracking-[0.3em] font-bold uppercase leading-relaxed">
                    &quot;L&apos;élégance est la seule beauté qui ne se fane
                    jamais.&quot;
                  </p>
                  <div className="w-12 h-px bg-primary glow-pink" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
