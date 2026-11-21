"use client"

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { resetPassword } from '@/lib/api/auth';
import { notifyError } from '@/lib/notify';
import { ZayBusyOverlay } from '@/components/ui/zay-busy-overlay';

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      notifyError(new Error('Lien invalide'), 'Lien invalide ou expiré');
      return;
    }
    if (password !== confirm) {
      notifyError(new Error('mismatch'), 'Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ token, newPassword: password });
      router.push('/connexion?reset=1');
    } catch (err: unknown) {
      notifyError(err, 'Lien invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-md bg-white p-8 md:p-12 shadow-sm border border-zay-border overflow-hidden"
    >
      <ZayBusyOverlay show={loading} label="Enregistrement…" />
      <h1 className="text-3xl font-headline italic text-center mb-2">
        Nouveau mot de passe
      </h1>
      <p className="text-center text-[0.65rem] tracking-widest uppercase text-zay-text-muted italic mb-8">
        Réinitialisation
      </p>
      {!token ? (
        <div className="space-y-6 text-center">
          <p className="text-sm italic font-light text-zay-text-muted">
            Lien invalide ou expiré.
          </p>
          <Button
            asChild
            className="w-full bg-primary hover:bg-zay-text text-white py-7 rounded-full text-[0.7rem] tracking-[0.3em] font-light uppercase"
          >
            <Link href="/mot-de-passe-oublie">Demander un nouveau lien</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-light text-zay-text-muted">
              Nouveau mot de passe
            </Label>
            <div className="relative">
              <Input
                required
                minLength={8}
                maxLength={72}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-zay-border pr-10 font-light"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zay-text-muted"
              >
                {showPassword ? (
                  <EyeOff size={16} strokeWidth={1} />
                ) : (
                  <Eye size={16} strokeWidth={1} />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-light text-zay-text-muted">
              Confirmer
            </Label>
            <Input
              required
              minLength={8}
              maxLength={72}
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-12 border-zay-border font-light"
            />
          </div>
          <Button
            disabled={loading}
            className="w-full bg-primary hover:bg-zay-text text-white py-7 rounded-full text-[0.7rem] tracking-[0.3em] font-light uppercase mt-4"
          >
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </form>
      )}
    </motion.div>
  );
}

export default function ReinitialiserMotDePassePage() {
  return (
    <div className="min-h-screen flex flex-col bg-zay-main">
      <Header />
      <main className="flex-grow flex items-center justify-center pt-40 md:pt-52 pb-24 px-4">
        <Suspense
          fallback={
            <div className="text-sm italic text-zay-text-muted">Chargement…</div>
          }
        >
          <ResetForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
