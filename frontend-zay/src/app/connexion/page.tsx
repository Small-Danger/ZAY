"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { login, register } from '@/lib/api';
import { syncCartWithServer } from '@/lib/cart-sync';
import { notifyError } from '@/lib/notify';
import { safeInternalPath } from '@/lib/auth/session';
import { useRouter } from 'next/navigation';
import { ZayBusyOverlay } from '@/components/ui/zay-busy-overlay';

export default function ConnexionPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [fromCheckout, setFromCheckout] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  useEffect(() => {
    const next = safeInternalPath(
      new URLSearchParams(window.location.search).get('next'),
    );
    setFromCheckout(next === '/checkout');
  }, []);

  const redirectAfterAuth = (role: string) => {
    const next = safeInternalPath(
      new URLSearchParams(window.location.search).get('next'),
    );
    if (next) {
      router.push(next);
      return;
    }
    router.push(role === 'ADMIN' ? '/admin' : '/compte');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await login({
        email: formData.email,
        password: formData.password,
      });
      await syncCartWithServer('merge').catch(() => {
        /* panier local conservé */
      });
      redirectAfterAuth(res.user.role);
    } catch (err: unknown) {
      notifyError(err, 'Erreur de connexion');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    try {
      const res = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      await syncCartWithServer('merge').catch(() => {
        /* panier local conservé */
      });
      redirectAfterAuth(res.user.role);
    } catch (err: unknown) {
      notifyError(err, 'Erreur inscription');
    } finally {
      setRegisterLoading(false);
    }
  };

  const busy = loginLoading || registerLoading;

  return (
    <div className="min-h-screen flex flex-col bg-zay-main">
      <Header />
      <main className="flex-grow flex items-center justify-center pt-40 md:pt-52 pb-24 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md bg-white p-8 md:p-12 shadow-sm border border-zay-border overflow-hidden"
        >
          <ZayBusyOverlay
            show={busy}
            label={loginLoading ? 'Connexion…' : 'Création du compte…'}
          />
          <h1 className="text-3xl font-headline italic text-center mb-2">Mon compte</h1>
          <p className="text-center text-[0.65rem] tracking-widest uppercase text-zay-text-muted italic mb-8">
            Connexion ou inscription
          </p>
          {fromCheckout && (
            <p className="text-[0.7rem] text-zay-text-muted italic font-light text-center mb-8">
              Connectez-vous ou créez un compte pour payer. Votre panier est conservé.
            </p>
          )}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zay-gray mb-10 h-12 p-1">
              <TabsTrigger value="login" className="text-[0.65rem] tracking-[0.2em] font-light uppercase data-[state=active]:bg-white">Connexion</TabsTrigger>
              <TabsTrigger value="register" className="text-[0.65rem] tracking-[0.2em] font-light uppercase data-[state=active]:bg-white">S'inscrire</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-light text-zay-text-muted">Email</Label>
                  <Input 
                    type="email" 
                    required
                    placeholder="votre@email.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="h-12 border-zay-border focus:ring-primary font-light" 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-light text-zay-text-muted">Mot de passe</Label>
                    <Link href="/contact" className="text-[0.6rem] text-primary hover:underline uppercase tracking-tighter font-light">Oublié ?</Link>
                  </div>
                  <div className="relative">
                    <Input 
                      required
                      minLength={8}
                      type={showPassword ? "text" : "password"} 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="h-12 border-zay-border pr-10 font-light" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zay-text-muted"
                    >
                      {showPassword ? <EyeOff size={16} strokeWidth={1} /> : <Eye size={16} strokeWidth={1} />}
                    </button>
                  </div>
                </div>
                <Button 
                  disabled={loginLoading}
                  className="w-full bg-primary hover:bg-zay-text text-white py-7 rounded-full text-[0.7rem] tracking-[0.3em] font-light uppercase mt-4"
                >
                  {loginLoading ? 'Connexion…' : 'Se connecter'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-6">
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-light text-zay-text-muted">Prénom</Label>
                    <Input 
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="h-12 border-zay-border font-light" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-light text-zay-text-muted">Nom</Label>
                    <Input 
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="h-12 border-zay-border font-light" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-light text-zay-text-muted">Email</Label>
                  <Input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="h-12 border-zay-border font-light" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[0.65rem] tracking-[0.1em] uppercase font-light text-zay-text-muted">Mot de passe</Label>
                  <Input 
                    type="password" 
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="h-12 border-zay-border font-light" 
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox id="terms" required />
                  <Label htmlFor="terms" className="text-[0.65rem] leading-none text-zay-text-muted italic font-light">
                    J&apos;accepte les{' '}
                    <Link href="/cgv" className="underline underline-offset-2 hover:text-primary transition-colors">
                      conditions générales de vente
                    </Link>
                  </Label>
                </div>
                <Button 
                  disabled={registerLoading}
                  className="w-full bg-primary hover:bg-zay-text text-white py-7 rounded-full text-[0.7rem] tracking-[0.3em] font-light uppercase"
                >
                  {registerLoading ? 'Création…' : 'Créer mon compte'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
