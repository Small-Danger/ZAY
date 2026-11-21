"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { forgotPassword } from '@/lib/api/auth';
import { notifyError } from '@/lib/notify';
import { ZayBusyOverlay } from '@/components/ui/zay-busy-overlay';

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (err: unknown) {
      notifyError(err, 'Impossible d’envoyer la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zay-main">
      <Header />
      <main className="flex-grow flex items-center justify-center pt-40 md:pt-52 pb-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md bg-white p-8 md:p-12 shadow-sm border border-zay-border overflow-hidden"
        >
          <ZayBusyOverlay show={loading} label="Envoi…" />
          <h1 className="text-3xl font-headline italic text-center mb-2">
            Mot de passe oublié
          </h1>
          <p className="text-center text-[0.65rem] tracking-widest uppercase text-zay-text-muted italic mb-8">
            ZAY Atelier
          </p>

          {sent ? (
            <div className="space-y-6 text-center">
              <p className="text-sm italic font-light leading-relaxed text-zay-text-muted">
                Si un compte existe, un e-mail vient d&apos;être envoyé.
              </p>
              <Button
                asChild
                className="w-full bg-primary hover:bg-zay-text text-white py-7 rounded-full text-[0.7rem] tracking-[0.3em] font-light uppercase"
              >
                <Link href="/connexion">Retour à la connexion</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-light text-zay-text-muted">
                  Email
                </Label>
                <Input
                  type="email"
                  required
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-zay-border focus:ring-primary font-light"
                />
              </div>
              <Button
                disabled={loading}
                className="w-full bg-primary hover:bg-zay-text text-white py-7 rounded-full text-[0.7rem] tracking-[0.3em] font-light uppercase mt-4"
              >
                {loading ? 'Envoi…' : 'Envoyer le lien'}
              </Button>
              <p className="text-center">
                <Link
                  href="/connexion"
                  className="text-[0.6rem] text-primary hover:underline uppercase tracking-tighter font-light"
                >
                  Retour à la connexion
                </Link>
              </p>
            </form>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
